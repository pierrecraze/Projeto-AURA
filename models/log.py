
from sqlalchemy import Column, BigInteger, String, DateTime, Integer, Text
from sqlalchemy.sql import func
from database.db import Base

class LogAuditoriaModel(Base):
    __tablename__ = "log_auditoria"

    id = Column(BigInteger, primary_key=True, index=True)
    data_hora = Column(DateTime, default=func.now(), nullable=False)
    tipo_ator = Column(String(30), nullable=False)
    ator_id = Column(Integer, nullable=False)
    acao_realizada = Column(String(100), nullable=False)
    tabela_afetada = Column(String(100), nullable=True)
    ip_origem = Column(String(45), nullable=True)
    detalhe = Column(Text, nullable=True)