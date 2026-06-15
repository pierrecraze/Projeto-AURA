from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database.db import Base
from sqlalchemy.orm import relationship

class GrupoModel(Base):
    __tablename__ = "instituicao"

    id = Column(Integer, primary_key=True, index=True)
    nome_fantasia = Column(String, nullable=False)
    cnpj = Column(String(14), nullable=False)
    cor = Column(String(7), nullable=True) # HEX code de 7 caracteres (ex: #FFFFFF)
    criado_em = Column(DateTime, default=datetime.now)
    deletado_em = Column(DateTime, nullable=True)
    medicos = relationship('MedicoModel', backref='instituicao')
    pacientes = relationship('PacienteModel', backref='instituicao')
