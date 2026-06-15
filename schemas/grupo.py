from pydantic import BaseModel, computed_field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class MedicoResumo(BaseModel):
    id: int
    nome: str
    crm: str
    deletado_em: Optional[datetime] = None

    @computed_field
    def status(self) -> str:
        return "Inativo" if self.deletado_em else "Ativo"

    class Config:
        from_attributes = True

class PacienteResumo(BaseModel):
    id: UUID
    nome: str
    cpf: Optional[str] = None
    deletado_em: Optional[datetime] = None

    @computed_field
    def status(self) -> str:
        return "Inativo" if self.deletado_em else "Ativo"
        
    class Config:
        from_attributes = True

# Classe base com os atributos comuns
class GrupoBase(BaseModel):
    nome_fantasia: str
    cnpj: str
    cor: Optional[str] = None

class GrupoCreate(GrupoBase):
    pass

# Modelo usado para devolver os dados da API (GET/PUT)
# Esse já inclui o ID que veio do banco
class Grupo(GrupoBase):
    id: int
    criado_em: datetime
    deletado_em: Optional[datetime] = None
    medicos: Optional[List[MedicoResumo]] = []
    pacientes: Optional[List[PacienteResumo]] = []

    class Config:
        # Permite que o Pydantic leia dados mesmo que venham como objetos de classes
        from_attributes = True
