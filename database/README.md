# Documentação da Base de Dados — Projeto AURA (v3.0)

Este diretório contém a infraestrutura da base de dados do **Ambiente Unificado de Rastreio e Avaliação (AURA)**. A modelagem foi desenvolvida em PostgreSQL e atua como a camada primária de Segurança de Aplicações (AppSec), Governança Clínica e Integridade de Dados do sistema.

---

## 1. Instruções de Inicialização Local

Para executar a API em ambiente de desenvolvimento local, a infraestrutura de dados deve ser inicializada de acordo com os seguintes passos:

1. Certifique-se de que o serviço do PostgreSQL está ativo no ambiente local.
2. Estabeleça ligação ao servidor utilizando um **utilizador com privilégios de superuser** (necessário para a criação da extensão `pg_trgm`).
3. Crie uma base de dados com a nomenclatura `AURA`.
4. Abra o ficheiro `schema.sql` (contido neste diretório) e execute o script na sua totalidade. 
5. **Ação Manual Obrigatória:** Como o sistema previne a exclusão do último Administrador Raiz, o primeiro utilizador com privilégios máximos deve ser inserido manualmente via instrução `INSERT` direta na base de dados (e não via API) após a criação das tabelas.

---

## 2. Arquitetura de Perfis e Fluxos de Acesso

O sistema AURA opera com **4 níveis de privilégios**. Para garantir o Princípio do Menor Privilégio e a conformidade com a regulamentação de proteção de dados, a base de dados impõe limites estritos, através de *triggers* e restrições estruturais, sobre as operações permitidas a cada perfil.

### Nível 1: Super Administrador (Nível Raiz)
Utilizador único responsável pela infraestrutura global do sistema. Gere a equipa técnica da plataforma AURA, mas não possui permissões de acesso aos dados clínicos sensíveis.
* **Fluxo Operacional:** Autenticação ➔ Criação de novos Administradores de Suporte ➔ Inativação de contas técnicas ➔ Análise de registos de auditoria globais.
* **Mecanismos de Controlo:**
  * **Unicidade Absoluta:** O índice `idx_unico_super_admin` garante, a nível estrutural, a existência de apenas uma conta ativa com este perfil.
  * **Prevenção de Orfandade de Sistema:** O *trigger* `trg_proteger_ultimo_super_admin` bloqueia qualquer transação que tente inativar ou rebaixar esta conta, impedindo a perda de controlo administrativo da plataforma.
  * **Rastreabilidade de Concessão:** A coluna `cadastrado_por_id` herda o ID deste administrador durante a criação de novos elementos de suporte.

### Nível 2: Administrador de Sistema (Suporte Técnico AURA)
Equipa técnica e de suporte (`perfil = 'admin'`). Responsáveis pelo licenciamento de novas clínicas na plataforma.
* **Fluxo Operacional:** Criação de `Instituição` (Clínicas) ➔ Registo base de `Profissional_Saude` ➔ Gestão do dicionário global de `Sintoma` referente à Síndrome do X Frágil.
* **Mecanismos de Controlo:**
  * **Bloqueio de Exclusão:** O *trigger* `trg_bloquear_delete_admin` impede a deleção física de administradores (`DELETE`). O processo de desvinculação exige a inativação lógica (`UPDATE status_ativo = FALSE`).
  * **Isolamento de Dados Sensíveis:** Este perfil não deve interagir com as tabelas `Paciente` ou `Avaliacao`. (Regra a ser implementada e validada nas rotas do *backend*).

### Nível 3: Administrador Institucional (Gestor de Clínica)
Um profissional de saúde designado com a permissão `'admin_clinica'` na tabela `Profissional_Instituicao`.
* **Fluxo Operacional:** Gestão de acessos dos profissionais circunscritos à sua instituição ➔ Extração de relatórios analíticos de diagnósticos locais.
* **Mecanismos de Controlo:**
  * **Isolamento de Inquilino (*Tenancy*):** As permissões são restritas ao seu respetivo `instituicao_id`. O *backend* deve utilizar a restrição `UNIQUE (profissional_id, instituicao_id)` para impedir perfis em duplicado na mesma instituição.

### Nível 4: Profissional de Saúde (Avaliador Clínico)
O utilizador final na aplicação clínica (`perfil = 'profissional'`).
* **Fluxo Operacional:** Autenticação ➔ Registo de `Paciente` e `Vinculo_Familiar` ➔ Registo de `Avaliacao` ➔ Assinatura digital do relatório.
* **Mecanismos de Controlo:**
  * **Limitação de Pedidos (*Rate Limiting*):** Regulado pelas funções `fn_registrar_falha_login`. Ocorrendo 5 falhas de autenticação, o registo sofre um bloqueio temporário de 15 minutos (coluna `bloqueado_ate`), mitigando ataques de força bruta.
  * **Retenção de Prontuário:** O *trigger* `trg_validar_soft_delete_paciente` inviabiliza a inativação de um paciente caso este já possua avaliações associadas, preservando o histórico de dados clínicos.

---

## 3. Imutabilidade e Governança Clínica (RNF13)

Os relatórios médicos, após a sua finalização, constituem documentos com valor legal. A integridade destes registos é assegurada pelas seguintes restrições ao nível do modelo de dados:
* **Imutabilidade da Avaliação:** O *trigger* `trg_bloquear_update_avaliacao` rejeita qualquer tentativa de modificação nos registos da tabela `Avaliacao`.
* **Preservação de Respostas e Ponderações:** O *trigger* `trg_bloquear_update_resposta` protege a tabela `Resposta_Avaliacao`. Complementarmente, a coluna `peso_snapshot` consolida o valor matemático do sintoma na data do diagnóstico, garantindo que alterações futuras na parametrização global não corrompam os históricos de pontuação.
* **Assinatura Desacoplada:** A assinatura digital do profissional é armazenada numa tabela dedicada de inserção única (*Insert-Only*) denominada `Assinatura_Avaliacao`, igualmente protegida por *triggers* contra edições e deleções.

---

## 4. Auditoria Contínua (Registos Polimórficos)

O sistema mantém um rastreamento rigoroso das operações através da tabela `Log_Auditoria`. A camada aplicacional (*backend*) tem o dever de registar nesta tabela qualquer operação sensível de criação, leitura, atualização ou deleção (CRUD).

* **Integridade Polimórfica:** Em substituição de identificadores genéricos, o AURA implementa relações explícitas (`admin_id` e `profissional_id`). Uma restrição `CHECK` assegura que, se a ação for classificada como `tipo_ator = 'profissional'`, a base de dados apenas aceitará a inserção se o `profissional_id` for válido e o `admin_id` for nulo, garantindo consistência referencial rigorosa.
* **Rastreabilidade de Rede:** A coluna `ip_origem` (`VARCHAR(45)`) permite a documentação completa de endereços IPv4 e IPv6 associados a cada pedido.
* **Otimização de Forense:** Os índices `idx_log_profissional` e `idx_log_admin` facilitam a extração de relatórios de auditoria e a investigação de incidentes de segurança de forma performante.

---

## 5. Decisões Estruturais e Otimizações de Desempenho

| Componente | Tipologia | Justificação de Arquitetura e Segurança (AppSec) |
| :--- | :--- | :--- |
| **Identificador de Paciente e Avaliação** (`id`) | `UUID` | **Mitigação de IDOR:** A função `gen_random_uuid()` impossibilita a enumeração sequencial de URLs, prevenindo a extração não autorizada de dados de terceiros. |
| **Vínculo Familiar** | Restrição `CHECK` | Para prevenir relações espelhadas em duplicado (ex: Paciente A associado a B, e B associado a A de forma independente), a base de dados utiliza as funções `LEAST` e `GREATEST` sobre o identificador UUID para normalizar a ordenação no momento do `INSERT`. |
| **Registo de Auditoria** (`id`) | `BIGSERIAL` | **Escalabilidade:** Evita a interrupção do serviço resultante do esgotamento da capacidade de inteiros de 32 bits (limite de 2.1 mil milhões de registos) em tabelas com crescimento exponencial. |
| **Índices de Pesquisa** | `GIN` / `pg_trgm` | Possibilita que a API execute pesquisas fracionadas no nome do paciente (ex: `LIKE '%silva%'`) através de árvores otimizadas, evitando o impacto severo no desempenho de varreduras completas às tabelas (*Table Scans*). |
