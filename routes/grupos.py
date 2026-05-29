from fastapi import APIRouter, status, HTTPException, Depends
from schemas.grupo import Grupo, GrupoCreate
from services import grupo_service

from core.security import obter_usuario_atual

# Colocando o cadeado na porta principal do arquivo
router = APIRouter(dependencies=[Depends(obter_usuario_atual)])

@router.post("/", response_model=Grupo, status_code=status.HTTP_201_CREATED)
async def cadastrar_grupo(grupo_in: GrupoCreate): #recebe os dados do grupo a ser criado
    novo_grupo = await grupo_service.criar_grupo_mock(grupo_in)
    return novo_grupo

@router.get("/", response_model=list[Grupo]) #devolve a lista de grupos cadastrados
async def listar_grupos():
    grupos = await grupo_service.listar_grupos_mock()
    return grupos

@router.put("/{id}", response_model=Grupo) #atualiza os dados de um grupo existente, identificando-o pelo ID
async def atualizar_grupo(id: int, grupo_in: GrupoCreate):
    grupo_atualizado = await grupo_service.atualizar_grupo_mock(id, grupo_in)
    if grupo_atualizado:
        return grupo_atualizado
    raise HTTPException(status_code=404, detail="Grupo não encontrado")

@router.delete("/{id_grupo}", response_model=Grupo)
async def inativar_grupo(id_grupo: int):
    grupo_inativado = await grupo_service.inativar_grupo_mock(id_grupo)

    if not grupo_inativado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Grupo não encontrado."
        )
        
    return grupo_inativado