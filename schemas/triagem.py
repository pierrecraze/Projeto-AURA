from pydantic import BaseModel, ConfigDict

# 1. A Base: O que é comum na entrada e na saída
class TriagemBase(BaseModel):
    medico_id: int
    paciente_id: int
    resultado: str

# 2. A Entrada: Dados exigidos na hora de criar a triagem (POST)
class TriagemCreate(TriagemBase):
    pass

# 3. A Saída: Como a triagem é devolvida pelo backend (com ID e Data gerados pelo sistema)
class Triagem(TriagemBase):
    id: int
    data_hora: str

    model_config = ConfigDict(from_attributes=True)