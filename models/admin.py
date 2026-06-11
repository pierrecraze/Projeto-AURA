from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database.db import Base

# Tabela de Administradores do Sistema
class AdminModel(Base):
    __tablename__ = "admin_sistema"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    senha_hash = Column(String(255), nullable=False)
    status = Column(String(20), default="Ativo", nullable=False)
    is_superadmin = Column(Boolean, default=False, nullable=False)
    cargo = Column(String(100), default="Administrador", nullable=False)
    criado_em = Column(DateTime, default=func.now(), nullable=False)