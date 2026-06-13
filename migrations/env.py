"""Ambiente do Alembic para o Projeto AURA.

Usa a mesma DATABASE_URL da aplicação (do .env) e o Base.metadata dos models,
para que `alembic revision --autogenerate` detecte mudanças de schema.
"""
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# Garante que a raiz do projeto está no path para importar os models.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv(override=True)

# Base + registro de TODOS os models (para o metadata ficar completo).
from database.db import Base
import models.admin       # noqa: F401
import models.grupo       # noqa: F401
import models.medico      # noqa: F401
import models.paciente    # noqa: F401
import models.triagem     # noqa: F401
import models.log         # noqa: F401
import models.item        # noqa: F401

config = context.config

# A URL vem do ambiente (.env), nunca hardcoded no alembic.ini.
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Gera o SQL sem conectar ao banco (modo --sql)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Conecta ao banco e aplica as migrações."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
