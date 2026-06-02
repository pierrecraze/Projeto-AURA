import asyncio
from schemas.grupo import Grupo, GrupoCreate
from models.grupo import GrupoModel

from schemas.log import LogCreate
from services import log_service

# Nosso "banco" temporário
banco_de_grupos = []

async def criar_grupo_mock(grupo_in: GrupoCreate):
    # Simula a demora de uma rede ou banco de dados real
    await asyncio.sleep(0.5) 
    
    novo_grupo = Grupo(
        id=len(banco_de_grupos) + 1,
        nome=grupo_in.nome,
        cnpj=grupo_in.cnpj,
        status=grupo_in.status,
        cor=grupo_in.cor,
        logo=grupo_in.logo
    )
    banco_de_grupos.append(novo_grupo)

    novo_log = LogCreate(
        entidade="Grupo",
        acao="Criação",
        detalhes=f"O grupo/convênio {novo_grupo.nome} (ID: {novo_grupo.id}) foi criado."
    )
    await log_service.criar_log_mock(novo_log)

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
            grupo.cor = grupo_in.cor
            grupo.logo = grupo_in.logo

            novo_log = LogCreate(
                entidade="Grupo",
                acao="Atualização",
                detalhes=f"Os dados do grupo/convênio {grupo.nome} (ID: {grupo.id}) foram atualizados."
            )
            await log_service.criar_log_mock(novo_log)

            return grupo
    return None

async def inativar_grupo_mock(id_grupo: int): # Inativar um grupo (Soft Delete)

    await asyncio.sleep(0.5)

    for grupo in banco_de_grupos:
        if grupo.id == id_grupo:
            # Em vez de apagar, fazemos o Soft Delete
            grupo.status = "Inativo"

            novo_log = LogCreate(
                entidade="Grupo",
                acao="Inativação",
                detalhes=f"O grupo/convênio {grupo.nome} (ID: {grupo.id}) foi inativado."
            )
            await log_service.criar_log_mock(novo_log)

            return grupo
            
    # Se não achar o grupo, retorna vazio
    return None

async def reativar_grupo_mock(id_grupo: int): # Reativar um grupo

    await asyncio.sleep(0.5)

    for grupo in banco_de_grupos:
        if grupo.id == id_grupo:
            grupo.status = "Ativo"

            novo_log = LogCreate(
                entidade="Grupo",
                acao="Reativação",
                detalhes=f"O grupo/convênio {grupo.nome} (ID: {grupo.id}) foi reativado."
            )
            await log_service.criar_log_mock(novo_log)

            return grupo
            
    return None