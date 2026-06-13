"""initial schema

Snapshot inicial do schema, gerado a partir do Base.metadata dos models.
Cria todas as tabelas existentes hoje. Para um banco que JÁ tem o schema
(produção), use `alembic stamp head` para marcá-lo como atual sem recriar nada.

Revision ID: 866987513c01
Revises:
Create Date: 2026-06-13 17:53:32.083486

"""
from typing import Sequence, Union

from alembic import op

# Importa Base + todos os models (env.py já registra, mas garantimos aqui também)
from database.db import Base
import models.admin       # noqa: F401
import models.grupo       # noqa: F401
import models.medico      # noqa: F401
import models.paciente    # noqa: F401
import models.triagem     # noqa: F401
import models.log         # noqa: F401
import models.item        # noqa: F401


# revision identifiers, used by Alembic.
revision: str = '866987513c01'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Cria todas as tabelas do schema atual (idempotente: só as que faltam)."""
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    """Remove todas as tabelas do schema."""
    Base.metadata.drop_all(bind=op.get_bind())
