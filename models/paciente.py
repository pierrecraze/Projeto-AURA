import uuid
from sqlalchemy import Column, String, Date, Integer, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from database.db import Base

class PacienteModel(Base):
    __tablename__ = "paciente"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(11), unique=True, nullable=True)
    data_nascimento = Column(Date, nullable=False)
    sexo_biologico = Column(String(1), CheckConstraint("sexo_biologico IN ('M', 'F')"), nullable=False)
    instituicao_id = Column(Integer, ForeignKey("instituicao.id"), nullable=False)
    cadastrado_por_id = Column(Integer, ForeignKey("profissional_saude.id"), nullable=False)
    
    data_cadastro = Column(DateTime, default=datetime.utcnow, nullable=False)
    deletado_em = Column(DateTime, nullable=True)

class ResponsavelModel(Base):
    __tablename__ = "responsavel"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    telefone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    deletado_em = Column(DateTime, nullable=True)

class PacienteResponsavelModel(Base):
    __tablename__ = "paciente_responsavel"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(UUID(as_uuid=True), ForeignKey("paciente.id"), nullable=False)
    responsavel_id = Column(Integer, ForeignKey("responsavel.id"), nullable=False)
    parentesco = Column(String(50), nullable=False)

class VinculoFamiliarModel(Base):
    __tablename__ = "vinculo_familiar"

    id = Column(Integer, primary_key=True, index=True)
    paciente_origem_id = Column(UUID(as_uuid=True), ForeignKey("paciente.id"), nullable=False)
    paciente_destino_id = Column(UUID(as_uuid=True), ForeignKey("paciente.id"), nullable=False)
    tipo_relacao = Column(String(50), nullable=False)
    termo_ref = Column(String(255), nullable=True)
    registrado_por_id = Column(Integer, ForeignKey("profissional_saude.id"), nullable=False)
    instituicao_registradora_id = Column(Integer, ForeignKey("instituicao.id"), nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)