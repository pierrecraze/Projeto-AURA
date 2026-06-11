-- ============================================================
--  AURA — Ambiente Unificado de Rastreio e Avaliação
--  Modelo Lógico — DDL Completo e Seguro (PostgreSQL)
--
--  Revisão de segurança: v3.0
--  Principais correções desta versão:
--    • Vinculo_Familiar: constraint de deduplicação corrigida para UUID
--    • Log_Auditoria: índices de investigação restaurados
--    • fn_proteger_ultimo_super_admin: cobre mudança de perfil além de inativação
--    • Resposta_Avaliacao: armazena peso_snapshot para laudos reproduzíveis
--    • Profissional_Saude: CRM passa a ter unicidade estadual (crm + uf)
--    • Paciente: sexo_biologico aceita 'I' (intersexo) e 'N' (não informado)
--    • Bloco 8 renomeado corretamente para "Funções de Controle de Login"
-- ============================================================

-- ============================================================
--  PRÉ-REQUISITO — EXTENSÕES
--  Deve ser executado uma única vez por banco de dados.
--  pg_trgm: habilita buscas parciais eficientes (LIKE '%nome%') via índice GIN.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ============================================================
--  BLOCO 1 — ACESSO E AUTENTICAÇÃO
--
--  Contém os dois tipos de usuários do sistema:
--    • Admin_Sistema ............. equipe interna da plataforma AURA
--    • Profissional_Saude ........ médicos e terapeutas das clínicas
--
--  Regras de segurança aplicadas aqui:
--    • Apenas UM super_admin pode existir (índice parcial único)
--    • Profissional tem bloqueio por tentativas de login (Bloco 8)
--    • Tokens de recuperação de senha têm expiração e uso único
-- ============================================================

CREATE TABLE IF NOT EXISTS Admin_Sistema (
    id                SERIAL       PRIMARY KEY,
    nome              VARCHAR(150) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    senha_hash        VARCHAR(255) NOT NULL,

    -- 'super_admin' é único no sistema (ver índice parcial abaixo).
    -- 'admin' são os atendentes de suporte da plataforma.
    perfil            VARCHAR(30)  NOT NULL DEFAULT 'admin'
                                   CHECK (perfil IN ('admin', 'super_admin')),

    status_ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
    cadastrado_por_id INTEGER      NULL REFERENCES Admin_Sistema(id),
    criado_em         TIMESTAMP    NOT NULL DEFAULT NOW(),

    -- Soft delete: nunca apagar, apenas marcar. O Trigger no Bloco 7 reforça isso.
    deletado_em       TIMESTAMP    NULL
);

-- Garante que o banco aceite APENAS UM super_admin na história do sistema.
-- O Trigger trg_proteger_ultimo_super_admin (Bloco 7) impede que ele seja inativado
-- ou rebaixado sem que haja um substituto.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unico_super_admin
    ON Admin_Sistema(perfil)
    WHERE perfil = 'super_admin';


CREATE TABLE IF NOT EXISTS Profissional_Saude (
    id               SERIAL       PRIMARY KEY,
    nome             VARCHAR(150) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    cpf              CHAR(11)     NOT NULL UNIQUE,

    -- CRM é um registro ESTADUAL (ex: CRM-SP 123456 ≠ CRM-RJ 123456).
    -- A unicidade é garantida pelo par (crm, uf), não pelo crm isolado.
    -- Formato esperado: apenas os dígitos numéricos (ex: '123456').
    crm              VARCHAR(20)  NOT NULL,

    telefone         VARCHAR(20)  NULL,
    cidade           VARCHAR(100) NULL,
    uf               CHAR(2)      NULL,
    data_nascimento  DATE         NOT NULL,
    senha_hash       VARCHAR(255) NOT NULL,

    -- Controle de rate-limiting de login. Gerenciado pelas funções do Bloco 8.
    -- Após 5 tentativas falhas: bloqueado_ate = NOW() + 15 minutos.
    tentativas_login SMALLINT     NOT NULL DEFAULT 0,
    bloqueado_ate    TIMESTAMP    NULL,

    -- Soft delete. Profissionais deletados não devem conseguir autenticar.
    -- A camada de aplicação DEVE verificar este campo no fluxo de login.
    deletado_em      TIMESTAMP    NULL,

    -- CRM único por estado, permitindo o mesmo número em UFs diferentes.
    UNIQUE (crm, uf)
);


CREATE TABLE IF NOT EXISTS Token_Recuperacao_Senha (
    id              SERIAL       PRIMARY KEY,
    profissional_id INTEGER      NOT NULL REFERENCES Profissional_Saude(id),
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    expira_em       TIMESTAMP    NOT NULL,

    -- Preenchido no momento do uso. Token usado não pode ser reutilizado.
    -- A aplicação deve verificar: expira_em > NOW() AND usado_em IS NULL.
    usado_em        TIMESTAMP    NULL
);


-- ============================================================
--  BLOCO 2 — ESTRUTURA INSTITUCIONAL
--
--  Uma Instituicao é uma clínica ou hospital cliente da plataforma.
--  Profissional_Instituicao é a tabela de junção que define qual
--  profissional pertence a qual clínica e com qual papel (perfil).
--
--  O campo perfil aqui é diferente do perfil em Admin_Sistema:
--    • 'profissional'  → acesso clínico padrão (avalia pacientes)
--    • 'admin_clinica' → gestor local (vê todos os pacientes da clínica)
--
--  REGRA DE ISOLAMENTO (Tenancy): toda query nas tabelas dos Blocos 3 e 4
--  deve ser filtrada por instituicao_id. O backend é responsável por
--  injetar esse filtro. O banco não consegue garantir isso sem RLS.
-- ============================================================

CREATE TABLE IF NOT EXISTS Instituicao (
    id            SERIAL       PRIMARY KEY,
    nome_fantasia VARCHAR(200) NOT NULL,
    cnpj          CHAR(14)     NOT NULL UNIQUE,

    -- Cor hexadecimal para personalização da interface da clínica (ex: '#3B82F6').
    cor           VARCHAR(7)   NULL,

    criado_em     TIMESTAMP    NOT NULL DEFAULT NOW(),
    deletado_em   TIMESTAMP    NULL
);


CREATE TABLE IF NOT EXISTS Profissional_Instituicao (
    id              SERIAL      PRIMARY KEY,
    profissional_id INTEGER     NOT NULL REFERENCES Profissional_Saude(id),
    instituicao_id  INTEGER     NOT NULL REFERENCES Instituicao(id),

    -- Papel do profissional NESTA clínica (independente de outras clínicas).
    perfil          VARCHAR(30) NOT NULL DEFAULT 'profissional'
                                CHECK (perfil IN ('profissional', 'admin_clinica')),

    status_ativo    BOOLEAN     NOT NULL DEFAULT TRUE,
    data_vinculo    DATE        NOT NULL DEFAULT CURRENT_DATE,
    deletado_em     TIMESTAMP   NULL,

    -- Um profissional só pode ter um vínculo ativo por instituição.
    UNIQUE (profissional_id, instituicao_id)
);


-- ============================================================
--  BLOCO 3 — PACIENTES E VÍNCULOS
--
--  Paciente usa UUID como PK (em vez de SERIAL) para:
--    • Impossibilitar enumeração sequencial via URL (/pacientes/1, /2, /3...)
--    • Facilitar geração de ID no lado do cliente sem risco de colisão
--
--  Responsavel é a pessoa de contato (pai, mãe, tutor) — pode ser
--  vinculado a múltiplos pacientes (ex: um pai com dois filhos no sistema).
--
--  Vinculo_Familiar registra parentesco ENTRE dois pacientes do sistema
--  (ex: dois irmãos que são ambos pacientes). Não confundir com Responsavel.
-- ============================================================

CREATE TABLE IF NOT EXISTS Paciente (
    id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    nome              VARCHAR(150) NOT NULL,

    -- CPF é opcional (crianças pequenas podem não ter).
    -- NULL não viola o UNIQUE — dois NULLs convivem sem conflito no PostgreSQL.
    cpf               CHAR(11)     UNIQUE NULL,

    data_nascimento   DATE         NOT NULL,

    -- Sexo biológico para fins clínicos (triagem da Síndrome do X Frágil é
    -- diferenciada por sexo). 'I' = intersexo, 'N' = não informado.
    sexo_biologico    CHAR(1)      NOT NULL CHECK (sexo_biologico IN ('M', 'F', 'I', 'N')),

    -- Define a qual clínica este paciente pertence (regra de Tenancy).
    instituicao_id    INTEGER      NOT NULL REFERENCES Instituicao(id),
    cadastrado_por_id INTEGER      NOT NULL REFERENCES Profissional_Saude(id),
    data_cadastro     TIMESTAMP    NOT NULL DEFAULT NOW(),

    -- Soft delete bloqueado por trigger se houver avaliações vinculadas (ver Bloco 9).
    deletado_em       TIMESTAMP    NULL
);


CREATE TABLE IF NOT EXISTS Responsavel (
    id          SERIAL       PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    telefone    VARCHAR(20)  NULL,
    email       VARCHAR(255) NULL,
    deletado_em TIMESTAMP    NULL
);


-- Tabela de junção N:N entre Paciente e Responsavel.
-- Um responsável pode responder por múltiplos pacientes (irmãos, por ex.).
CREATE TABLE IF NOT EXISTS Paciente_Responsavel (
    id             SERIAL      PRIMARY KEY,
    paciente_id    UUID        NOT NULL REFERENCES Paciente(id),
    responsavel_id INTEGER     NOT NULL REFERENCES Responsavel(id),
    parentesco     VARCHAR(50) NOT NULL,
    UNIQUE (paciente_id, responsavel_id)
);


CREATE TABLE IF NOT EXISTS Vinculo_Familiar (
    id                          SERIAL       PRIMARY KEY,
    paciente_origem_id          UUID         NOT NULL REFERENCES Paciente(id),
    paciente_destino_id         UUID         NOT NULL REFERENCES Paciente(id),
    tipo_relacao                VARCHAR(50)  NOT NULL,

    -- Referência bibliográfica ou terminologia clínica usada para descrever o vínculo.
    termo_ref                   VARCHAR(255) NULL,

    registrado_por_id           INTEGER      NOT NULL REFERENCES Profissional_Saude(id),
    instituicao_registradora_id INTEGER      NOT NULL REFERENCES Instituicao(id),
    criado_em                   TIMESTAMP    NOT NULL DEFAULT NOW(),
    deletado_em                 TIMESTAMP    NULL,

    -- Impede que um paciente seja vinculado a si mesmo.
    CHECK (paciente_origem_id <> paciente_destino_id),

    -- ATENÇÃO: UUIDs são comparados lexicograficamente, não numericamente.
    -- Para evitar registros espelhados (A→B e B→A simultâneos), normalizamos
    -- a ordem usando LEAST/GREATEST sobre o texto do UUID.
    -- Isso garante que apenas um dos dois sentidos possa existir na tabela.
    UNIQUE (
        LEAST(paciente_origem_id::TEXT, paciente_destino_id::TEXT),
        GREATEST(paciente_origem_id::TEXT, paciente_destino_id::TEXT)
    )
);


-- ============================================================
--  BLOCO 4 — AVALIAÇÃO CLÍNICA
--
--  Fluxo de uma avaliação:
--    1. Profissional cria um registro em Avaliacao (cabeçalho do laudo).
--    2. Para cada sintoma do questionário, insere em Resposta_Avaliacao.
--       O peso_snapshot captura o valor do sintoma NESTE momento — se o
--       Admin alterar o peso futuramente, o laudo histórico não muda.
--    3. Após revisão, o profissional assina digitalmente via Assinatura_Avaliacao.
--
--  IMUTABILIDADE (RNF13): Avaliacao, Resposta_Avaliacao e Assinatura_Avaliacao
--  são todas insert-only. Os Triggers do Bloco 7 bloqueiam UPDATE e DELETE.
-- ============================================================

CREATE TABLE IF NOT EXISTS Sintoma (
    id        SERIAL       PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,

    -- Peso padrão do sintoma no cálculo do score. Pode ser alterado pelo Admin,
    -- mas avaliações já realizadas ficam protegidas pelo campo peso_snapshot
    -- em Resposta_Avaliacao.
    peso      SMALLINT     NOT NULL DEFAULT 1,

    categoria VARCHAR(100) NULL,
    ativo     BOOLEAN      NOT NULL DEFAULT TRUE
);


-- Cabeçalho do laudo. Imutável após inserção (ver triggers no Bloco 7).
CREATE TABLE IF NOT EXISTS Avaliacao (
    id                          UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
    data_hora                   TIMESTAMP NOT NULL DEFAULT NOW(),
    score_total                 SMALLINT  NOT NULL,
    recomendacao_encaminhamento BOOLEAN   NOT NULL,

    -- Tenancy: a qual clínica pertence esta avaliação (herdado do paciente,
    -- mas registrado aqui para queries de BI sem necessidade de JOIN).
    paciente_id                 UUID      NOT NULL REFERENCES Paciente(id),
    profissional_id             INTEGER   NOT NULL REFERENCES Profissional_Saude(id)
);


-- Assinatura digital do laudo. Tabela separada para ser insert-only sem
-- conflitar com o trigger de imutabilidade de Avaliacao (RNF13).
-- Uma avaliação SÓ PODE TER UMA assinatura (UNIQUE em avaliacao_id).
CREATE TABLE IF NOT EXISTS Assinatura_Avaliacao (
    id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    avaliacao_id    UUID         NOT NULL UNIQUE REFERENCES Avaliacao(id),
    assinatura_hash VARCHAR(255) NOT NULL,
    assinado_em     TIMESTAMP    NOT NULL DEFAULT NOW(),
    ip_origem       VARCHAR(45)  NULL  -- IPv4 (15 chars) ou IPv6 (39 chars). VARCHAR(45) é suficiente.
);


-- Respostas individuais do questionário. Imutável após inserção.
-- peso_snapshot: congela o valor do sintoma no momento da avaliação.
--   Isso garante que o score_total seja auditável e reproduzível mesmo
--   se o Admin alterar o peso do sintoma no futuro.
CREATE TABLE IF NOT EXISTS Resposta_Avaliacao (
    id             BIGSERIAL    PRIMARY KEY,
    avaliacao_id   UUID         NOT NULL REFERENCES Avaliacao(id),
    sintoma_id     INTEGER      NOT NULL REFERENCES Sintoma(id),
    presente       BOOLEAN      NOT NULL,

    -- Peso do sintoma no momento exato da avaliação (snapshot imutável).
    peso_snapshot  SMALLINT     NOT NULL,

    observacao     TEXT         NULL,
    UNIQUE (avaliacao_id, sintoma_id)
);


-- ============================================================
--  BLOCO 5 — AUDITORIA
--
--  Registra toda ação relevante para conformidade (LGPD, RNF03, RNF17).
--  A tabela é polimórfica: o ator pode ser um Profissional_Saude ou um
--  Admin_Sistema. A CHECK constraint garante que apenas UMA das FKs esteja
--  preenchida de cada vez, e que ela corresponda ao tipo_ator declarado.
--
--  Esta tabela cresce indefinidamente. Para ambientes de produção, avaliar:
--    • Particionamento por data: PARTITION BY RANGE (data_hora)
--    • Política de retenção: arquivar registros com mais de N anos
-- ============================================================

CREATE TABLE IF NOT EXISTS Log_Auditoria (
    id             BIGSERIAL    PRIMARY KEY,
    data_hora      TIMESTAMP    NOT NULL DEFAULT NOW(),

    -- Discriminador do ator. Determina qual FK abaixo estará preenchida.
    tipo_ator      VARCHAR(30)  NOT NULL CHECK (tipo_ator IN ('profissional', 'admin_sistema')),

    -- Exatamente UMA das duas FKs abaixo estará preenchida (garantido pela CHECK abaixo).
    profissional_id INTEGER     NULL REFERENCES Profissional_Saude(id),
    admin_id        INTEGER     NULL REFERENCES Admin_Sistema(id),

    acao_realizada VARCHAR(100) NOT NULL,  -- ex: 'LOGIN', 'CRIAR_PACIENTE', 'ASSINAR_AVALIACAO'
    tabela_afetada VARCHAR(100) NULL,      -- ex: 'Paciente', 'Avaliacao'
    ip_origem      VARCHAR(45)  NULL,
    detalhe        TEXT         NULL,      -- JSON ou texto livre com contexto adicional

    -- Integridade polimórfica: impossível ter o tipo_ator errado para a FK preenchida.
    CHECK (
        (tipo_ator = 'profissional'  AND profissional_id IS NOT NULL AND admin_id IS NULL) OR
        (tipo_ator = 'admin_sistema' AND admin_id IS NOT NULL AND profissional_id IS NULL)
    )
);


-- ============================================================
--  BLOCO 6 — ÍNDICES
--
--  Estratégia:
--    • GIN com pg_trgm para buscas parciais por nome (LIKE '%texto%')
--    • B-tree parciais (WHERE deletado_em IS NULL) para filtrar registros ativos
--    • Índices compostos para as joins mais frequentes (RLS de Tenancy)
--    • Índices de investigação em Log_Auditoria para auditorias de segurança
-- ============================================================

-- Paciente: busca por nome (RF09) e isolamento por clínica (Tenancy)
CREATE INDEX IF NOT EXISTS idx_paciente_nome_trgm    ON Paciente USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_paciente_instituicao  ON Paciente(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_paciente_ativos       ON Paciente(deletado_em) WHERE deletado_em IS NULL;

-- Avaliação: histórico clínico do paciente e relatórios por profissional
CREATE INDEX IF NOT EXISTS idx_avaliacao_paciente    ON Avaliacao(paciente_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_profissional ON Avaliacao(profissional_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_data        ON Avaliacao(data_hora DESC);

-- Vínculo profissional-clínica: usado na verificação de Tenancy a cada requisição
CREATE INDEX IF NOT EXISTS idx_prof_inst_profissional ON Profissional_Instituicao(profissional_id, status_ativo);
CREATE INDEX IF NOT EXISTS idx_prof_inst_instituicao  ON Profissional_Instituicao(instituicao_id, status_ativo);

-- Token de recuperação: valida token ativo (não expirado e não usado)
CREATE INDEX IF NOT EXISTS idx_token_profissional    ON Token_Recuperacao_Senha(profissional_id);
CREATE INDEX IF NOT EXISTS idx_token_expira          ON Token_Recuperacao_Senha(expira_em) WHERE usado_em IS NULL;

-- Auditoria: investigação por ator (segurança) e por data (relatórios)
CREATE INDEX IF NOT EXISTS idx_log_profissional      ON Log_Auditoria(profissional_id) WHERE profissional_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_log_admin             ON Log_Auditoria(admin_id)        WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_log_data              ON Log_Auditoria(data_hora DESC);


-- ============================================================
--  BLOCO 7 — TRIGGERS DE GOVERNANÇA E SEGURANÇA
--
--  Regras que o banco impõe independentemente da aplicação:
--    [1] Admin_Sistema nunca pode ser deletado (apenas inativado)
--    [2] O último super_admin ativo não pode ser inativado nem rebaixado
--    [3] Avaliacao é imutável após inserção (RNF13)
--    [4] Resposta_Avaliacao é imutável após inserção (RNF13)
--    [5] Assinatura_Avaliacao é imutável após inserção
-- ============================================================

-- [1] Bloqueia DELETE em Admin_Sistema — use status_ativo = FALSE para inativar
CREATE OR REPLACE FUNCTION fn_bloquear_delete_admin()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        '[AURA-SEC-001] DELETE bloqueado: administradores não podem ser apagados. '
        'Para desativar, use: UPDATE Admin_Sistema SET status_ativo = FALSE WHERE id = %.', OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloquear_delete_admin ON Admin_Sistema;
CREATE TRIGGER trg_bloquear_delete_admin
    BEFORE DELETE ON Admin_Sistema
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_delete_admin();


-- [2] Impede inativação E rebaixamento do último super_admin ativo.
--     Cobre dois cenários:
--       (a) status_ativo: TRUE → FALSE  (inativação direta)
--       (b) perfil: 'super_admin' → 'admin'  (rebaixamento de perfil)
CREATE OR REPLACE FUNCTION fn_proteger_ultimo_super_admin()
RETURNS TRIGGER AS $$
DECLARE
    qtd_ativos INTEGER;
BEGIN
    -- Dispara apenas se a mudança afeta o super_admin ativo
    IF OLD.perfil = 'super_admin' AND OLD.status_ativo = TRUE THEN
        IF NEW.status_ativo = FALSE OR NEW.perfil <> 'super_admin' THEN
            SELECT COUNT(*) INTO qtd_ativos
            FROM Admin_Sistema
            WHERE perfil = 'super_admin' AND status_ativo = TRUE;

            -- COUNT inclui o próprio registro (BEFORE trigger), então <= 1 significa "só ele"
            IF qtd_ativos <= 1 THEN
                RAISE EXCEPTION
                    '[AURA-SEC-002] Operação bloqueada: o sistema não pode ficar sem um super_admin ativo. '
                    'Promova outro administrador antes de alterar este registro.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proteger_ultimo_super_admin ON Admin_Sistema;
CREATE TRIGGER trg_proteger_ultimo_super_admin
    BEFORE UPDATE ON Admin_Sistema
    FOR EACH ROW EXECUTE FUNCTION fn_proteger_ultimo_super_admin();


-- [3] Avaliacao — imutável após inserção (RNF13)
CREATE OR REPLACE FUNCTION fn_bloquear_alteracao_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        '[AURA-SEC-003] Operação bloqueada: laudos de avaliação são imutáveis após registro (RNF13). '
        'Avaliação ID: %.', OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloquear_update_avaliacao ON Avaliacao;
CREATE TRIGGER trg_bloquear_update_avaliacao
    BEFORE UPDATE ON Avaliacao
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao_avaliacao();

DROP TRIGGER IF EXISTS trg_bloquear_delete_avaliacao ON Avaliacao;
CREATE TRIGGER trg_bloquear_delete_avaliacao
    BEFORE DELETE ON Avaliacao
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao_avaliacao();


-- [4] Resposta_Avaliacao — imutável após inserção (RNF13)
CREATE OR REPLACE FUNCTION fn_bloquear_alteracao_resposta()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        '[AURA-SEC-004] Operação bloqueada: respostas de avaliação são imutáveis após registro (RNF13).';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloquear_update_resposta ON Resposta_Avaliacao;
CREATE TRIGGER trg_bloquear_update_resposta
    BEFORE UPDATE ON Resposta_Avaliacao
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao_resposta();

DROP TRIGGER IF EXISTS trg_bloquear_delete_resposta ON Resposta_Avaliacao;
CREATE TRIGGER trg_bloquear_delete_resposta
    BEFORE DELETE ON Resposta_Avaliacao
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao_resposta();


-- [5] Assinatura_Avaliacao — imutável após inserção
CREATE OR REPLACE FUNCTION fn_bloquear_alteracao_assinatura()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        '[AURA-SEC-005] Operação bloqueada: assinaturas clínicas são imutáveis após registro.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloquear_update_assinatura ON Assinatura_Avaliacao;
CREATE TRIGGER trg_bloquear_update_assinatura
    BEFORE UPDATE ON Assinatura_Avaliacao
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao_assinatura();

DROP TRIGGER IF EXISTS trg_bloquear_delete_assinatura ON Assinatura_Avaliacao;
CREATE TRIGGER trg_bloquear_delete_assinatura
    BEFORE DELETE ON Assinatura_Avaliacao
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao_assinatura();


-- ============================================================
--  BLOCO 8 — FUNÇÕES DE CONTROLE DE LOGIN
--
--  IMPORTANTE: estas são stored procedures, NÃO triggers automáticos.
--  A aplicação backend é responsável por chamá-las nos momentos corretos:
--
--    • Falha no login  → CALL fn_registrar_falha_login(id_do_profissional)
--    • Login com sucesso → CALL fn_resetar_tentativas_login(id_do_profissional)
--
--  Lógica de bloqueio:
--    • A cada falha: tentativas_login += 1
--    • Na 5ª falha (>= 5): bloqueado_ate = NOW() + 15 minutos
--    • Login bem-sucedido: zera contador e remove bloqueio
--
--  ATENÇÃO: a aplicação também deve verificar Profissional_Saude.deletado_em
--  antes de permitir qualquer tentativa de login.
-- ============================================================

-- Chamada pelo backend a cada senha incorreta
CREATE OR REPLACE FUNCTION fn_registrar_falha_login(p_profissional_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE Profissional_Saude
    SET
        tentativas_login = tentativas_login + 1,
        bloqueado_ate    = CASE
                               WHEN tentativas_login + 1 >= 5
                               THEN NOW() + INTERVAL '15 minutes'
                               ELSE bloqueado_ate
                           END
    WHERE id = p_profissional_id
      AND deletado_em IS NULL;  -- Não processa profissionais inativos
END;
$$ LANGUAGE plpgsql;


-- Chamada pelo backend após autenticação bem-sucedida
CREATE OR REPLACE FUNCTION fn_resetar_tentativas_login(p_profissional_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE Profissional_Saude
    SET
        tentativas_login = 0,
        bloqueado_ate    = NULL
    WHERE id = p_profissional_id
      AND deletado_em IS NULL;  -- Salvaguarda: não reativa profissionais deletados
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  BLOCO 9 — SOFT DELETE SEGURO DE PACIENTE
--
--  Regra (RF11): um paciente só pode ser excluído se NÃO tiver nenhuma
--  avaliação registrada. Caso contrário, o dado clínico ficaria órfão.
--
--  Implementação: trigger BEFORE UPDATE que intercepta a atribuição de
--  deletado_em e aborta se houver avaliações vinculadas.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validar_soft_delete_paciente()
RETURNS TRIGGER AS $$
DECLARE
    total_avaliacoes INTEGER;
BEGIN
    -- Dispara somente quando deletado_em está sendo definido pela primeira vez
    IF NEW.deletado_em IS NOT NULL AND OLD.deletado_em IS NULL THEN

        SELECT COUNT(*) INTO total_avaliacoes
        FROM Avaliacao
        WHERE paciente_id = OLD.id;

        IF total_avaliacoes > 0 THEN
            RAISE EXCEPTION
                '[AURA-SEC-006] Exclusão bloqueada: o paciente possui % avaliação(ões) vinculada(s). '
                'Dados clínicos não podem ser removidos (RF11). Paciente ID: %.',
                total_avaliacoes, OLD.id;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_soft_delete_paciente ON Paciente;
CREATE TRIGGER trg_validar_soft_delete_paciente
    BEFORE UPDATE ON Paciente
    FOR EACH ROW EXECUTE FUNCTION fn_validar_soft_delete_paciente();


-- ============================================================
--  FIM DO SCRIPT
--
--  Checklist de deploy:
--    [ ] Executar como usuário com privilégios de superuser (para CREATE EXTENSION)
--    [ ] Verificar que pg_trgm está disponível no servidor PostgreSQL
--    [ ] Após deploy, inserir o super_admin via INSERT direto no banco (não via API)
--    [ ] Configurar job de limpeza de Token_Recuperacao_Senha expirados
--    [ ] Avaliar particionamento de Log_Auditoria por data em produção
-- ============================================================
