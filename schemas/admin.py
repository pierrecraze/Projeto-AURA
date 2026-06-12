from pydantic import BaseModel, EmailStr
from typing import Optional

class AdminBase(BaseModel):
    nome: str
    email: EmailStr
    status: str = "Ativo"
    is_superadmin: bool = False
    cargo: str = "Administrador"

class AdminCreate(AdminBase):
    senha: str

class AdminUpdate(AdminBase):
    pass

class AdminResponse(AdminBase):
    id: int

    class Config:
        from_attributes = True