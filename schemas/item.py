from pydantic import BaseModel
from typing import Optional

# Classe base com o que todo Item tem
class ItemBase(BaseModel):
    nome: str
    descricao: Optional[str] = None

# Modelo usado para receber dados no cadastro (POST)
# Não pede ID porque o ID é gerado pelo banco/sistema
class ItemCreate(ItemBase):
    pass

# Modelo usado para devolver os dados da API (GET/PUT)
# Esse já inclui o ID que veio do banco
class Item(ItemBase):
    id: int

    class Config:
        # Permite que o Pydantic leia dados mesmo que venham como objetos de classes
        from_attributes = True