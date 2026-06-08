from schemas.log import LogCreate, Log
from models.log import LogAuditoriaModel
from database.db import SessionLocal
from sqlalchemy.orm import Session

async def criar_log(log_in: LogCreate):
    # O Log precisa de uma sessão própria independente,
    # assim garantimos a inserção do log mesmo se houver rolback de outras operações.
    db = SessionLocal()
    try:
        novo_log = LogAuditoriaModel(
            tipo_ator=log_in.tipo_ator,
            ator_id=log_in.ator_id,
            acao_realizada=log_in.acao_realizada,
            tabela_afetada=log_in.tabela_afetada,
            ip_origem=log_in.ip_origem,
            detalhe=log_in.detalhe
        )
        db.add(novo_log)
        db.commit()
        db.refresh(novo_log)
        return novo_log
    finally:
        db.close()

async def listar_logs(db: Session):
    # Puxa os logs ordenados do mais recente pro mais antigo
    return db.query(LogAuditoriaModel).order_by(LogAuditoriaModel.data_hora.desc()).all()