-- ============================================================
-- AURA — Ambiente Unificado de Rastreio e Avaliação
-- Modelo Lógico — DDL completo (PostgreSQL)
-- ============================================================

-- ============================================================
-- BLOCO 1 — ACESSO E AUTENTICAÇÃO
-- ============================================================

CREATE TABLE IF NOT EXISTS Admin_Sistema (
    id          SERIAL          PRIMARY KEY,
    nome        VARCHAR(150)    NOT NULL,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    senha_hash  VARCHAR(255)    NOT NULL,
    criado_em   TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Profissional_Saude (
    id                  SERIAL          PRIMARY KEY,
    nome                VARCHAR(150)    NOT NULL,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    cpf                 CHAR(11)        NOT NULL UNIQUE,
    crm                 VARCHAR(20)     NOT NULL UNIQUE,
    telefone            VARCHAR(20)     NULL,
    cidade              VARCHAR(100)    NULL,
    uf                  CHAR(2)         NULL,
    data_nascimento     DATE            NOT NULL,
    senha_hash          VARCHAR(255)    NOT NULL,
    tentativas_login    SMALLINT        NOT NULL DEFAULT 0,
    bloqueado_ate       TIMESTAMP       NULL,
    deletado_em         TIMESTAMP       NULL
);

CREATE TABLE IF NOT EXISTS Token_Recuperacao_Senha (
    id              SERIAL          PRIMARY KEY,
    profissional_id INTEGER         NOT NULL REFERENCES Profissional_Saude(id),
    token_hash      VARCHAR(255)    NOT NULL UNIQUE,
    expira_em       TIMESTAMP       NOT NULL,
    usado_em        TIMESTAMP       NULL
);

-- ============================================================
-- BLOCO 2 — ESTRUTURA INSTITUCIONAL
-- ============================================================

CREATE TABLE IF NOT EXISTS Instituicao (
    id              SERIAL          PRIMARY KEY,
    nome_fantasia   VARCHAR(200)    NOT NULL,
    cnpj            CHAR(14)        NOT NULL UNIQUE,
    cor             VARCHAR(7)      NULL,
    criado_em       TIMESTAMP       NOT NULL DEFAULT NOW(),
    deletado_em     TIMESTAMP       NULL
);

CREATE TABLE IF NOT EXISTS Profissional_Instituicao (
    id              SERIAL          PRIMARY KEY,
    profissional_id INTEGER         NOT NULL REFERENCES Profissional_Saude(id),
    instituicao_id  INTEGER         NOT NULL REFERENCES Instituicao(id),
    perfil          VARCHAR(30)     NOT NULL DEFAULT 'profissional'
                                    CHECK (perfil IN ('profissional', 'admin_clinica')),
    status_ativo    BOOLEAN         NOT NULL DEFAULT TRUE,
    data_vinculo    DATE            NOT NULL DEFAULT CURRENT_DATE,
    deletado_em     TIMESTAMP       NULL,
    UNIQUE (profissional_id, instituicao_id)
);

-- ============================================================
-- BLOCO 3 — PACIENTES E RESPONSÁVEIS
-- ============================================================

CREATE TABLE IF NOT EXISTS Paciente (
    id                      UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
    nome                    VARCHAR(150)    NOT NULL,
    cpf                     CHAR(11)        UNIQUE NULL,
    data_nascimento         DATE            NOT NULL,
    sexo_biologico          CHAR(1)         NOT NULL CHECK (sexo_biologico IN ('M', 'F')),
    instituicao_id          INTEGER         NOT NULL REFERENCES Instituicao(id),
    cadastrado_por_id       INTEGER         NOT NULL REFERENCES Profissional_Saude(id),
    data_cadastro           TIMESTAMP       NOT NULL DEFAULT NOW(), -- <-- Adicione esta linha
    deletado_em             TIMESTAMP       NULL
);

CREATE TABLE IF NOT EXISTS Responsavel (
    id          SERIAL          PRIMARY KEY,
    nome        VARCHAR(150)    NOT NULL,
    telefone    VARCHAR(20)     NULL,
    email       VARCHAR(255)    NULL,
    deletado_em TIMESTAMP       NULL
);

CREATE TABLE IF NOT EXISTS Paciente_Responsavel (
    id              SERIAL          PRIMARY KEY,
    paciente_id     UUID            NOT NULL REFERENCES Paciente(id),
    responsavel_id  INTEGER         NOT NULL REFERENCES Responsavel(id),
    parentesco      VARCHAR(50)     NOT NULL,
    UNIQUE (paciente_id, responsavel_id)
);

CREATE TABLE IF NOT EXISTS Vinculo_Familiar (
    id                          SERIAL          PRIMARY KEY,
    paciente_origem_id          UUID            NOT NULL REFERENCES Paciente(id),
    paciente_destino_id         UUID            NOT NULL REFERENCES Paciente(id),
    tipo_relacao                VARCHAR(50)     NOT NULL,
    termo_ref                   VARCHAR(255)    NULL,
    registrado_por_id           INTEGER         NOT NULL REFERENCES Profissional_Saude(id),
    instituicao_registradora_id INTEGER         NOT NULL REFERENCES Instituicao(id),
    criado_em                   TIMESTAMP       NOT NULL DEFAULT NOW(),
    CHECK (paciente_origem_id <> paciente_destino_id),
    UNIQUE (paciente_origem_id, paciente_destino_id)
);

-- ============================================================
-- BLOCO 4 — AVALIAÇÃO CLÍNICA
-- ============================================================

CREATE TABLE IF NOT EXISTS Sintoma (
    id          SERIAL          PRIMARY KEY,
    descricao   VARCHAR(255)    NOT NULL,
    peso        SMALLINT        NOT NULL DEFAULT 1,
    categoria   VARCHAR(100)    NULL,
    ativo       BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS Avaliacao (
    id                          UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
    data_hora                   TIMESTAMP       NOT NULL DEFAULT NOW(),
    score_total                 SMALLINT        NOT NULL,
    recomendacao_encaminhamento BOOLEAN         NOT NULL,
    assinatura_hash             VARCHAR(255)    NULL,
    assinado_em                 TIMESTAMP       NULL,
    paciente_id                 UUID            NOT NULL REFERENCES Paciente(id),
    profissional_id             INTEGER         NOT NULL REFERENCES Profissional_Saude(id)
);

CREATE TABLE IF NOT EXISTS Resposta_Avaliacao (
    id              BIGSERIAL       PRIMARY KEY,
    avaliacao_id    UUID            NOT NULL REFERENCES Avaliacao(id),
    sintoma_id      INTEGER         NOT NULL REFERENCES Sintoma(id),
    presente        BOOLEAN         NOT NULL,
    observacao      TEXT            NULL,
    UNIQUE (avaliacao_id, sintoma_id)
);

-- ============================================================
-- BLOCO 5 — AUDITORIA
-- ============================================================

CREATE TABLE IF NOT EXISTS Log_Auditoria (
    id              BIGSERIAL       PRIMARY KEY,
    data_hora       TIMESTAMP       NOT NULL DEFAULT NOW(),
    tipo_ator       VARCHAR(30)     NOT NULL CHECK (tipo_ator IN ('profissional', 'admin_sistema')),
    ator_id         INTEGER         NOT NULL,
    acao_realizada  VARCHAR(100)    NOT NULL,
    tabela_afetada  VARCHAR(100)    NULL,
    ip_origem       VARCHAR(45)     NULL,
    detalhe         TEXT            NULL
);

-- ============================================================
-- BLOCO 6 — ÍNDICES
-- ============================================================

-- Buscas frequentes de paciente por nome (RF09)
CREATE INDEX IF NOT EXISTS idx_paciente_nome            ON Paciente(nome);
CREATE INDEX IF NOT EXISTS idx_paciente_instituicao     ON Paciente(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_paciente_deletado        ON Paciente(deletado_em) WHERE deletado_em IS NULL;

-- Avaliações por paciente (RF05, RF15)
CREATE INDEX IF NOT EXISTS idx_avaliacao_paciente       ON Avaliacao(paciente_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_profissional   ON Avaliacao(profissional_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_data           ON Avaliacao(data_hora DESC);

-- Vínculos do profissional por instituição (RLS)
CREATE INDEX IF NOT EXISTS idx_prof_inst_profissional   ON Profissional_Instituicao(profissional_id, status_ativo);
CREATE INDEX IF NOT EXISTS idx_prof_inst_instituicao    ON Profissional_Instituicao(instituicao_id, status_ativo);

-- Token de recuperação (RF17)
CREATE INDEX IF NOT EXISTS idx_token_profissional       ON Token_Recuperacao_Senha(profissional_id);
CREATE INDEX IF NOT EXISTS idx_token_expira             ON Token_Recuperacao_Senha(expira_em) WHERE usado_em IS NULL;

-- Auditoria por ator (RNF03, RNF17)
CREATE INDEX IF NOT EXISTS idx_log_ator                 ON Log_Auditoria(ator_id, tipo_ator);
CREATE INDEX IF NOT EXISTS idx_log_data                 ON Log_Auditoria(data_hora DESC);

-- ============================================================
-- BLOCO 7 — TRIGGERS DE IMUTABILIDADE (RNF13)
-- ============================================================

-- Impede UPDATE e DELETE em Avaliacao após inserção
CREATE OR REPLACE FUNCTION fn_bloquear_alteracao_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'Operação bloqueada: avaliações são imutáveis após registro (RNF13).';
END;
$$ LANGUAGE plpgsql;

-- O PostgreSQL não tem 'CREATE TRIGGER IF NOT EXISTS', então o DROP anterior garante que não dê erro
DROP TRIGGER IF EXISTS trg_bloquear_update_avaliacao ON Avaliacao;
CREATE TRIGGER trg_bloquear_update_avaliacao
    BEFORE UPDATE ON Avaliacao
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao_avaliacao();

DROP TRIGGER IF EXISTS trg_bloquear_delete_avaliacao ON Avaliacao;
CREATE TRIGGER trg_bloquear_delete_avaliacao
    BEFORE DELETE ON Avaliacao
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao_avaliacao();

-- Impede UPDATE e DELETE em Resposta_Avaliacao após inserção
CREATE OR REPLACE FUNCTION fn_bloquear_alteracao_resposta()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'Operação bloqueada: respostas de avaliação são imutáveis após registro (RNF13).';
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

-- ============================================================
-- BLOCO 8 — TRIGGER DE BLOQUEIO DE LOGIN (RNF17)
-- ============================================================

-- Chamada pela aplicação ao registrar falha de login.
-- Incrementa tentativas e bloqueia por 15 min ao atingir 5.
CREATE OR REPLACE FUNCTION fn_registrar_falha_login(p_profissional_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE Profissional_Saude
    SET
        tentativas_login = tentativas_login + 1,
        bloqueado_ate = CASE
            WHEN tentativas_login + 1 >= 5
            THEN NOW() + INTERVAL '15 minutes'
            ELSE bloqueado_ate
        END
    WHERE id = p_profissional_id;
END;
$$ LANGUAGE plpgsql;

-- Chamada pela aplicação ao realizar login com sucesso.
CREATE OR REPLACE FUNCTION fn_resetar_tentativas_login(p_profissional_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE Profissional_Saude
    SET
        tentativas_login = 0,
        bloqueado_ate    = NULL
    WHERE id = p_profissional_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- BLOCO 9 — TRIGGER DE SOFT DELETE SEGURO EM PACIENTE (RF11)
-- ============================================================

-- Impede soft delete se existirem avaliações vinculadas
CREATE OR REPLACE FUNCTION fn_validar_soft_delete_paciente()
RETURNS TRIGGER AS $$
DECLARE
    total_avaliacoes INTEGER;
BEGIN
    IF NEW.deletado_em IS NOT NULL AND OLD.deletado_em IS NULL THEN
        SELECT COUNT(*) INTO total_avaliacoes
        FROM Avaliacao
        WHERE paciente_id = OLD.id;

        IF total_avaliacoes > 0 THEN
            RAISE EXCEPTION
                'Exclusão bloqueada: o paciente possui % avaliação(ões) vinculada(s). (RF11)',
                total_avaliacoes;
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
-- FIM DO SCRIPT
-- ============================================================
