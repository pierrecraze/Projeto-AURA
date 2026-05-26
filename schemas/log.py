from pydantic import BaseModel
from pydantic import BaseModel, ConfigDict

# Classe base com os atributos comuns
class LogBase(BaseModel):
    acao: str
    entidade: str
    detalhes: str

# Usado para RECEBER dados (POST)
class LogCreate(LogBase):
    pass

# Usado para DEVOLVER dados (Tem o ID do banco)
class Log(LogBase):
    id: int
    data_hora: str

    model_config = ConfigDict(from_attributes=True)