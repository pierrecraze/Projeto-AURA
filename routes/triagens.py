from fastapi import APIRouter, HTTPException, status
from schemas.triagem import Triagem, TriagemCreate
from services import triagem_service

router = APIRouter(prefix="/api/triagens", tags=["Triagens"])

@router.post("/", response_model=Triagem, status_code=status.HTTP_201_CREATED)
async def registrar_triagem(triagem_in: TriagemCreate):
    nova_triagem = await triagem_service.criar_triagem_mock(triagem_in)
    return nova_triagem

@router.get("/", response_model=list[Triagem])
async def listar_triagens():
    triagens = await triagem_service.listar_triagens_mock()
    return triagens

@router.put("/{id_triagem}", response_model=Triagem)
async def atualizar_triagem(id_triagem: int, triagem_in: TriagemCreate):
    triagem_atualizada = await triagem_service.atualizar_triagem_mock(id_triagem, triagem_in)
    if triagem_atualizada:
        return triagem_atualizada
    raise HTTPException(status_code=404, detail="Triagem não encontrada")

@router.delete("/{id_triagem}", response_model=Triagem)
async def deletar_triagem(id_triagem: int):
    triagem_deletada = await triagem_service.deletar_triagem_mock(id_triagem)
    if not triagem_deletada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Triagem não encontrada."
        )
    return triagem_deletada