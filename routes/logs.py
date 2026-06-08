from fastapi import APIRouter, status, HTTPException, Depends
from schemas.log import Log, LogCreate
from services import log_service
from sqlalchemy.orm import Session
from database.db import SessionLocal

from core.security import obter_usuario_atual

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

@router.get("/", response_model=list[Log]) #devolve a lista de logs cadastrados
async def listar_logs(db: Session = Depends(get_db)):
    logs = await log_service.listar_logs(db)
    return logs