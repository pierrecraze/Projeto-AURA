import uuid
from sqlalchemy import Column, Integer, Boolean, String, Text, DateTime, ForeignKey, SmallInteger
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from database.db import Base

class AvaliacaoModel(Base):
    __tablename__ = "avaliacao"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data_hora = Column(DateTime, default=datetime.utcnow, nullable=False)
    score_total = Column(SmallInteger, nullable=False)
    recomendacao_encaminhamento = Column(Boolean, nullable=False)
    # Lista (JSON) dos sintomas assinalados na avaliação — usada no relatório PDF
    sintomas = Column(Text, nullable=True)
    assinatura_hash = Column(String(255), nullable=True)
    assinado_em = Column(DateTime, nullable=True)
    
    paciente_id = Column(UUID(as_uuid=True), ForeignKey("paciente.id"), nullable=False)
    profissional_id = Column(Integer, ForeignKey("profissional_saude.id"), nullable=False)