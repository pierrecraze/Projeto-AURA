from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import date, datetime

# Classe base com os atributos comuns
class MedicoBase(BaseModel):
    nome: str
    email: str
    cpf: str
    crm: str = Field(..., min_length=4, description="O CRM é obrigatório e deve possuir no mínimo 4 caracteres.")
    telefone: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = Field(None, max_length=2, description="UF deve conter no máximo 2 caracteres.")
    data_nascimento: date

# Usado para RECEBER dados (POST)
class MedicoCreate(MedicoBase):
    senha: str
    # Instituição do médico — se omitida, entra na instituição padrão
    instituicao_id: Optional[int] = None

# Usado para ATUALIZAR dados (PUT) - Não exige a senha
class MedicoUpdate(MedicoBase):
    pass

# Usado para DEVOLVER dados (Tem o ID do banco) e omite a senha
class Medico(MedicoBase):
    id: int
    instituicao_id: Optional[int] = None
    tentativas_login: int
    bloqueado_ate: Optional[datetime] = None
    deletado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)