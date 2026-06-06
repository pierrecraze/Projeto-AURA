# 🗄️ Banco de Dados — Projeto AURA

Este diretório contém a infraestrutura de banco de dados do **Ambiente Unificado de Rastreio e Avaliação (AURA)**. A modelagem foi construída no PostgreSQL e desenhada não apenas para armazenar dados, mas para atuar como a camada primária de segurança (AppSec) e governança clínica do sistema.

## 🚀 Como Inicializar o Banco Localmente

Para rodar a API localmente, você precisará inicializar este banco de dados na sua máquina:
1. Certifique-se de ter o PostgreSQL rodando localmente (ou via Docker).
2. Abra o seu gerenciador de banco de dados (ex: DBeaver, pgAdmin).
3. Conecte-se ao seu servidor local e crie um banco chamado `AURA`.
4. Abra o arquivo `schema.sql` (contido nesta pasta) no editor SQL.
5. Execute o script por completo. Ele possui proteções `IF NOT EXISTS` e criará todas as tabelas, índices e funções na ordem correta de dependências.

---

## ⚙️ Fluxos e Mecânicas Explícitas do Sistema

O banco de dados gerencia as relações do sistema impondo regras estritas de integridade. O fluxo opera da seguinte forma:

1. **Vínculo Institucional (N:N):** Um `Profissional_Saude` não acessa pacientes de forma global. Ele é atrelado a uma `Instituicao` através da tabela de pivô `Profissional_Instituicao`. Esta tabela possui uma restrição `UNIQUE (profissional_id, instituicao_id)` que impede que a API duplique vínculos acidentalmente. O nível de acesso na clínica é governado pela coluna `perfil` (`CHECK (perfil IN ('profissional', 'admin_clinica'))`).
2. **Gestão de Pacientes:** O profissional cadastra um `Paciente` e um `Responsavel`. A relação é N:N na tabela `Paciente_Responsavel`, exigindo a declaração do `parentesco`. 
3. **Mapeamento Genético:** Pacientes podem ser vinculados a outros pacientes (ex: irmãos) através da tabela `Vinculo_Familiar`. A regra `CHECK (paciente_origem_id <> paciente_destino_id)` impede que a API vincule um paciente a ele mesmo.
4. **Prontuário:** A tabela central `Avaliacao` gera um cabeçalho único do laudo. As respostas daquela avaliação são salvas em `Resposta_Avaliacao`, que faz uma intersecção com a tabela de domínio `Sintoma`. Uma constraint `UNIQUE (avaliacao_id, sintoma_id)` impede que a mesma pergunta seja respondida duas vezes no mesmo laudo.

---

## 🛡️ Regras de Negócio Nativas (Triggers e Functions)

Para garantir que falhas no backend não corrompam os dados ou violem normas de saúde, a inteligência central de segurança reside diretamente no banco via PL/pgSQL:

### 1. Defesa contra Força Bruta (Rate Limiting Nativo)
O controle de falhas de login não depende do backend. Ele é executado chamando funções no banco:
* **Mecânica de Falha:** Quando a API registra uma senha incorreta, ela deve chamar a função `fn_registrar_falha_login(id)`. Esta função realiza um `UPDATE` incrementando a coluna `tentativas_login` em +1.
* **Mecânica de Bloqueio:** Dentro do mesmo `UPDATE`, se `tentativas_login` atingir **5**, a coluna `bloqueado_ate` recebe imediatamente o valor de `NOW() + INTERVAL '15 minutes'`. Se a API consultar o médico e esta coluna for maior que o timestamp atual, o acesso deve ser negado com HTTP 403/401.
* **Mecânica de Sucesso:** Ao logar com sucesso, a API deve chamar `fn_resetar_tentativas_login(id)`, que zera as tentativas e define `bloqueado_ate` como `NULL`.

### 2. Imutabilidade Clínica (Conformidade em Saúde)
Laudos médicos salvos não podem ser adulterados ou apagados.
* **Mecânica:** As tabelas `Avaliacao` e `Resposta_Avaliacao` possuem triggers do tipo `BEFORE UPDATE` e `BEFORE DELETE`.
* **Ação:** Qualquer instrução `UPDATE` ou `DELETE` disparada pelo backend contra um registro já inserido nestas tabelas será abortada pelo banco, retornando o erro: `RAISE EXCEPTION 'Operação bloqueada: avaliações são imutáveis após registro'`. Correções devem ser feitas criando uma nova avaliação, mantendo o rastro histórico.

### 3. Soft Delete Seguro e Dependência Histórica
O sistema não utiliza hard deletes (deleção física do disco) para entidades vitais.
* **Mecânica:** A exclusão de um paciente ocorre preenchendo a coluna `deletado_em` com o timestamp atual.
* **Ação de Segurança:** A trigger `trg_validar_soft_delete_paciente` intercepta o `UPDATE` no campo `deletado_em`. Ela realiza um `SELECT COUNT(*)` na tabela `Avaliacao` buscando o `OLD.id` do paciente. Se o resultado for maior que zero (ou seja, o paciente já possui laudos clínicos gerados), a inativação é abortada e a exceção devolvida para o backend.

---

## 🏗️ Decisões de Modelagem e Tipagem de Dados

| Tabela / Coluna | Tipo Escolhido | Justificativa Arquitetural e AppSec |
| :--- | :--- | :--- |
| **Paciente** (`id`) | `UUID` | **Mitigação de IDOR:** O valor `DEFAULT gen_random_uuid()` gera um hash (ex: `123e4567-e89b...`). Impede que atacantes alterem a URL da API (enumeração sequencial) para visualizar dados de outros pacientes, ocultando o volume total de dados da clínica. |
| **Avaliacao** (`id`) | `UUID` | **Mitigação de Vazamento de Laudo:** Pelo mesmo princípio, laudos médicos possuem URLs alfanuméricas complexas, protegendo o acesso não autorizado. |
| **Log_Auditoria** (`id`) | `BIGSERIAL` | **Escalabilidade:** Tabelas de eventos crescem infinitamente. `BIGSERIAL` (8 bytes) impede o crash do banco por estouro de ID (limite do `SERIAL` comum é 2.1 bilhões). |
| **Resposta_Avaliacao** (`id`) | `BIGSERIAL` | **Escalabilidade:** Multiplica-se 1 avaliação por ~30 sintomas, resultando em 30 linhas inseridas por consulta. `BIGSERIAL` previne o estouro de limite de inteiros a longo prazo. |
| **Log_Auditoria** (`ip_origem`) | `VARCHAR(45)` | **Conformidade de Rede:** Tamanho exato para comportar endereços IPv6 completos mapeados. |
| **Profissional** (`cpf`) | `CHAR(11)` | **Otimização de Espaço:** Tipo de tamanho fixo. Exige que a API envie o dado higienizado (sem formatação `.-`), garantindo consistência na busca e indexação. |
| **Admin / Profissional** (`senha_hash`)| `VARCHAR(255)`| **Criptografia:** Tamanho reservado para suportar algoritmos pesados de derivação de chaves (como BCrypt ou Argon2id), garantindo compatibilidade futura caso o padrão criptográfico do backend mude. |

---

## 🔍 Estratégia de Índices (Performance)

A arquitetura já prevê índices para evitar *Table Scans* (varredura completa do banco) que degradam o tempo de resposta da API:
* **Índices Parciais:** `idx_paciente_deletado` escaneia e armazena em memória apenas os pacientes onde `deletado_em IS NULL`, acelerando absurdamente as buscas da rotina diária da clínica e ignorando os registros antigos.
* **Índices Reversos:** O `idx_avaliacao_data` e `idx_log_data` organizam a árvore B-Tree em ordem descendente (`DESC`), otimizando endpoints de paginação do tipo *"listar os 10 mais recentes"*.
* **Foreign Keys Indexadas:** O PostgreSQL não indexa Chaves Estrangeiras por padrão. Índices foram criados explicitamente para colunas como `paciente_id` e `profissional_id` para acelerar consultas com `JOIN`.
