# schemas/paciente.py
from pydantic import BaseModel

# Classe base com os atributos comuns
class PacienteBase(BaseModel):
    nome: str
    cpf: str
    status: str

# Usado para RECEBER dados (POST)
class PacienteCreate(PacienteBase):
    pass

# Usado para DEVOLVER dados (Tem o ID do banco)
class Paciente(PacienteBase):
    id: int