from pydantic import BaseModel, ConfigDict

class PacienteBase(BaseModel):
    nome: str
    cpf: str
    status: str
    responsavel: list[str] 
    grupos: list[str]
    
class PacienteCreate(PacienteBase):
    pass

class Paciente(PacienteBase):
    id: int
    data_cadastro: str

    # Necessário para o Pydantic converter o PacienteModel do banco em JSON
    model_config = ConfigDict(from_attributes=True)