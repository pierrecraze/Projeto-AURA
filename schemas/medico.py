from pydantic import BaseModel
from pydantic import BaseModel, ConfigDict

# Classe base com os atributos comuns
class MedicoBase(BaseModel):
    nome: str
    crm: str
    email: str
    status: str
    grupos: list[str]

# Usado para RECEBER dados (POST)
class MedicoCreate(MedicoBase):
    senha: str

# Usado para DEVOLVER dados (Tem o ID do banco)
class Medico(MedicoBase):
    id: int
    data_cadastro: str

    model_config = ConfigDict(from_attributes=True)