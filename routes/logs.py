from fastapi import APIRouter, status, HTTPException
from schemas.log import Log, LogCreate
from services import log_service

router = APIRouter(prefix="/api/logs", tags=["Logs"])

@router.post("/", response_model=Log, status_code=status.HTTP_201_CREATED)
async def registrar_log(log_in: LogCreate): #recebe os dados do log a ser criado
    novo_log = await log_service.criar_log_mock(log_in)
    return novo_log

@router.get("/", response_model=list[Log]) #devolve a lista de logs cadastrados
async def listar_logs():
    logs = await log_service.listar_logs_mock()
    return logs