from fastapi import APIRouter, status, HTTPException, Depends
from schemas.log import Log, LogCreate
from services import log_service
from sqlalchemy.orm import Session
from database.db import SessionLocal

from core.security import obter_usuario_atual
from models.admin import AdminModel
from models.medico import MedicoModel

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Colocando o cadeado na porta principal do arquivo
router = APIRouter(dependencies=[Depends(obter_usuario_atual)])

@router.post("/", response_model=Log, status_code=status.HTTP_201_CREATED)
async def registrar_log(log_in: LogCreate): #recebe os dados do log a ser criado
    novo_log = await log_service.criar_log(log_in)
    return novo_log

@router.get("/") # Removido o response_model para podermos adicionar o campo "ator_nome" livremente
async def listar_logs(db: Session = Depends(get_db)):
    logs = await log_service.listar_logs(db)
    
    logs_enriquecidos = []
    for log in logs:
        # Transforma o log num dicionário para podermos injetar o nome dinamicamente
        log_dict = {
            "id": log.id,
            "tabela_afetada": log.tabela_afetada,
            "acao_realizada": log.acao_realizada,
            "data_hora": log.data_hora,
            "detalhe": log.detalhe,
            "tipo_ator": log.tipo_ator,
            "ator_id": log.ator_id,
            "ip_origem": log.ip_origem,
            "ator_nome": "Sistema" # Valor padrão
        }
        
        if log.tipo_ator == "admin_sistema" and log.ator_id:
            admin = db.query(AdminModel).filter(AdminModel.id == log.ator_id).first()
            if admin: log_dict["ator_nome"] = admin.nome
        elif log.tipo_ator == "medico" and log.ator_id:
            medico = db.query(MedicoModel).filter(MedicoModel.id == log.ator_id).first()
            if medico: log_dict["ator_nome"] = medico.nome
            
        logs_enriquecidos.append(log_dict)
        
    return logs_enriquecidos