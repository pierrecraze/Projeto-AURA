from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from uuid import UUID

# Sub-schema para aceitar responsáveis aninhados na criação
class ResponsavelBase(BaseModel):
    nome: str
    parentesco: str = "Não informado"
    telefone: Optional[str] = None

class PacienteBase(BaseModel):
    nome: str
    cpf: Optional[str] = None
    data_nascimento: date
    sexo_biologico: str

class PacienteCreate(PacienteBase):
    responsaveis: Optional[list[ResponsavelBase]] = None

class Paciente(PacienteBase):
    id: UUID
    instituicao_id: int
    cadastrado_por_id: int
    data_cadastro: datetime
    deletado_em: Optional[datetime] = None

    # Necessário para o Pydantic converter o PacienteModel do banco em JSON
    model_config = ConfigDict(from_attributes=True)

class VinculoFamiliarCreate(BaseModel):
    paciente_destino_id: UUID
    tipo_relacao: str
    termo_ref: Optional[str] = None
    registrado_por_id: int
    instituicao_registradora_id: int

class VinculoFamiliar(VinculoFamiliarCreate):
    id: int
    paciente_origem_id: UUID
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)