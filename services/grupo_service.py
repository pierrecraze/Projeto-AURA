import asyncio
from schemas.grupo import Grupo, GrupoCreate
from models.grupo import GrupoModel

from schemas.log import LogCreate
from services import log_service

class GrupoDatabaseMock:
    """Repositório mock encapsulando o armazenamento (Preparação para SQLAlchemy)"""
    def __init__(self):
        self._banco = []

    def listar(self):
        return self._banco

    def buscar_por_id(self, id_grupo: int):
        return next((g for g in self._banco if g.id == id_grupo), None)

    def adicionar(self, grupo: Grupo):
        self._banco.append(grupo)

    def proximo_id(self):
        return max((g.id for g in self._banco), default=0) + 1
        
    def commit(self):
        # Simula o session.commit() do SQLAlchemy
        pass

db = GrupoDatabaseMock()

async def criar_grupo_mock(grupo_in: GrupoCreate):
    # Simula a demora de uma rede ou banco de dados real
    await asyncio.sleep(0.5) 
    
    novo_grupo = Grupo(
        id=db.proximo_id(),
        nome=grupo_in.nome,
        cnpj=grupo_in.cnpj,
        status=grupo_in.status,
        cor=grupo_in.cor,
        logo=grupo_in.logo
    )
    db.adicionar(novo_grupo)
    db.commit()

    novo_log = LogCreate(
        entidade="Grupo",
        acao="Criação",
        detalhes=f"O grupo/convênio {novo_grupo.nome} (ID: {novo_grupo.id}) foi criado."
    )
    await log_service.criar_log_mock(novo_log)

    return novo_grupo

async def listar_grupos_mock():
    await asyncio.sleep(0.2)
    return db.listar()

async def atualizar_grupo_mock(id: int, grupo_in: GrupoCreate):
    
    await asyncio.sleep(0.5)

    grupo = db.buscar_por_id(id)
    if grupo:
        grupo.nome = grupo_in.nome
        grupo.cnpj = grupo_in.cnpj
        grupo.status = grupo_in.status
        grupo.cor = grupo_in.cor
        grupo.logo = grupo_in.logo
        db.commit()

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

    grupo = db.buscar_por_id(id_grupo)
    if grupo:
        # Em vez de apagar, fazemos o Soft Delete
        grupo.status = "Inativo"
        db.commit()

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

    grupo = db.buscar_por_id(id_grupo)
    if grupo:
        grupo.status = "Ativo"
        db.commit()

        novo_log = LogCreate(
            entidade="Grupo",
            acao="Reativação",
            detalhes=f"O grupo/convênio {grupo.nome} (ID: {grupo.id}) foi reativado."
        )
        await log_service.criar_log_mock(novo_log)

        return grupo
            
    return None