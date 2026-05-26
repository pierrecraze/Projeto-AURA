import asyncio
from schemas.log import LogCreate, Log
from models.log import LogModel
from datetime import datetime

banco_de_logs = []

async def criar_log_mock(log_in: LogCreate):
    await asyncio.sleep(0.5)

    novo_id = len(banco_de_logs) + 1

    novo_log = LogModel(
        id=novo_id,
        data_hora=datetime.now().isoformat(),
        acao=log_in.acao,
        entidade=log_in.entidade,
        detalhes=log_in.detalhes
    )
    banco_de_logs.append(novo_log)
    return novo_log

async def listar_logs_mock():
    await asyncio.sleep(0.2)
    return banco_de_logs
       