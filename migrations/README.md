# Migrações de banco (Alembic)

As mudanças de schema do Projeto AURA são versionadas com Alembic. A URL do banco
vem de `DATABASE_URL` (no `.env`) — nunca fica hardcoded.

> Rode os comandos com o Python 3.12 do venv, que tem todas as dependências:
> `venv/bin/python3.12 -m alembic ...`

## Banco que JÁ existe (produção atual)

O schema já está criado (o `create_all` do boot cuidava disso). Marque-o como
"na revisão mais recente" **sem recriar nada**:

```bash
venv/bin/python3.12 -m alembic stamp head
```

## Banco novo (do zero)

```bash
venv/bin/python3.12 -m alembic upgrade head
```

## Criar uma nova migração após mudar um model

1. Edite o model (ex.: adicione uma coluna).
2. Gere a migração automaticamente comparando models × banco:

```bash
venv/bin/python3.12 -m alembic revision --autogenerate -m "descricao da mudanca"
```

3. **Revise** o arquivo gerado em `versions/` (o autogenerate erra às vezes).
4. Aplique:

```bash
venv/bin/python3.12 -m alembic upgrade head
```

## Comandos úteis

- `alembic history` — lista as revisões.
- `alembic current` — mostra em que revisão o banco está.
- `alembic downgrade -1` — desfaz a última migração.

## Observação sobre o deploy

O `main.py` ainda roda `Base.metadata.create_all` no boot para servir de bootstrap
no deploy serverless (Vercel), que não tem etapa de migração. Quando o pipeline
passar a rodar `alembic upgrade head`, esse `create_all` pode ser removido.
