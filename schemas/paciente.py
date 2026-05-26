from pydantic import BaseModel, ConfigDict

class PacienteBase(BaseModel):
    nome: str
    cpf: str
    status: str
    responsavel: list[str]  # Corrigido o 'n'
    grupos: list[str]       # Adicionado para vincular aos convênios

class PacienteCreate(PacienteBase):
    pass

class Paciente(PacienteBase):
    id: int

    # Necessário para o Pydantic converter o PacienteModel do banco em JSON
    model_config = ConfigDict(from_attributes=True)