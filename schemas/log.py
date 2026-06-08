from pydantic import BaseModel
from pydantic import ConfigDict
from typing import Optional
from datetime import datetime

# Classe base com os atributos comuns
class LogBase(BaseModel):
    acao_realizada: str
    tabela_afetada: Optional[str] = None
    detalhe: Optional[str] = None
    tipo_ator: str = "admin_sistema"
    ator_id: int = 1
    ip_origem: Optional[str] = "127.0.0.1"

# Usado para RECEBER dados (POST)
class LogCreate(LogBase):
    pass

# Usado para DEVOLVER dados (Tem o ID do banco)
class Log(LogBase):
    id: int
    data_hora: datetime

    model_config = ConfigDict(from_attributes=True)