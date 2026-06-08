from pydantic import BaseModel, Field

# Schemas para a página de configurações
class PerfilUpdate(BaseModel):
    nome: str = Field(..., min_length=2, description="Nome completo")
    email: str = Field(..., description="Endereço de E-mail")

class SenhaUpdate(BaseModel):
    senha_atual: str
    nova_senha: str = Field(..., min_length=8, description="Nova senha, mínimo 8 caracteres")