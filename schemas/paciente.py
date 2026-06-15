from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from uuid import UUID

# Sub-schema para aceitar responsáveis aninhados na criação/edição
class ResponsavelBase(BaseModel):
    nome: str
    parentesco: str = "Não informado"
    cpf: Optional[str] = None
    telefone: Optional[str] = None

class PacienteBase(BaseModel):
    nome: str
    cpf: Optional[str] = None
    data_nascimento: date
    sexo_biologico: str
    nome_mae: Optional[str] = None
    nome_pai: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    pais: Optional[str] = None

class PacienteCreate(PacienteBase):
    instituicao_id: Optional[int] = None
    cadastrado_por_id: Optional[int] = None
    responsaveis: Optional[list[ResponsavelBase]] = None
    # Checklist clínico {nome_do_sintoma: bool} — opcional na criação/edição
    sintomas: Optional[dict] = None

class Paciente(PacienteBase):
    id: UUID
    instituicao_id: int
    cadastrado_por_id: int
    data_cadastro: datetime
    deletado_em: Optional[datetime] = None
    sintomas: Optional[dict] = None
    # Responsáveis vinculados (preenchido pelas rotas de detalhe/atualização)
    responsaveis: Optional[list[ResponsavelBase]] = None

    # Necessário para o Pydantic converter o PacienteModel do banco em JSON
    model_config = ConfigDict(from_attributes=True)

# Payload enxuto para salvar apenas o formulário clínico (checkboxes de sintomas)
class SintomasUpdate(BaseModel):
    sintomas: dict

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