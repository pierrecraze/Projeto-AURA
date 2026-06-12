from sqlalchemy import Column, Integer, String, Date, DateTime, SmallInteger, ForeignKey
from database.db import Base

class MedicoModel(Base):
    __tablename__ = "profissional_saude"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    # Instituição à qual o médico pertence — pacientes são compartilhados
    # entre todos os médicos da mesma instituição
    instituicao_id = Column(Integer, ForeignKey("instituicao.id"), nullable=True)
    email = Column(String(255), nullable=False, unique=True)
    cpf = Column(String(11), nullable=False, unique=True)
    crm = Column(String(20), nullable=False, unique=True)
    telefone = Column(String(20), nullable=True)
    cidade = Column(String(100), nullable=True)
    uf = Column(String(2), nullable=True)
    data_nascimento = Column(Date, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    tentativas_login = Column(SmallInteger, nullable=False, default=0)
    bloqueado_ate = Column(DateTime, nullable=True)
    deletado_em = Column(DateTime, nullable=True)