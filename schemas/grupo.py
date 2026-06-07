from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

    class Config:
        # Permite que o Pydantic leia dados mesmo que venham como objetos de classes
        from_attributes = True