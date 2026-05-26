import asyncio
from schemas.grupo import Grupo, GrupoCreate
from models.grupo import GrupoModel

# Nosso "banco" temporário
banco_de_grupos = []

async def criar_grupo_mock(grupo_in: GrupoCreate):
    # Simula a demora de uma rede ou banco de dados real
    await asyncio.sleep(0.5) 
    
    novo_grupo = Grupo(
        id=len(banco_de_grupos) + 1,
        nome=grupo_in.nome,
        cnpj=grupo_in.cnpj,
        status=grupo_in.status
    )
    banco_de_grupos.append(novo_grupo)
    return novo_grupo

async def listar_grupos_mock():
    await asyncio.sleep(0.2)
    return banco_de_grupos

async def atualizar_grupo_mock(id: int, grupo_in: GrupoCreate):
    
    await asyncio.sleep(0.5)

    for grupo in banco_de_grupos:
        if grupo.id == id:
            grupo.nome = grupo_in.nome
            grupo.cnpj = grupo_in.cnpj
            grupo.status = grupo_in.status
            return grupo
    return None

async def inativar_grupo_mock(id_grupo: int): # Inativar um grupo (Soft Delete)

    await asyncio.sleep(0.5)

    for grupo in banco_de_grupos:
        if grupo.id == id_grupo:
            # Em vez de apagar, fazemos o Soft Delete
            grupo.status = "Inativo"
            return grupo
            
    # Se não achar o grupo, retorna vazio
    return None