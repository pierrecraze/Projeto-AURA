from fastapi import APIRouter, status, HTTPException
from schemas.medico import Medico, MedicoCreate
from services import medico_service

router = APIRouter(prefix="/api/medicos", tags=["Médicos"])

@router.post("/", response_model=Medico, status_code=status.HTTP_201_CREATED)
async def cadastrar_medico(medico_in: MedicoCreate): #recebe os dados do médico a ser criado
    novo_medico = await medico_service.criar_medico_mock(medico_in)
    return novo_medico

@router.get("/", response_model=list[Medico]) #devolve a lista de médicos cadastrados sem a senha (que é um dado sensível)
async def listar_medicos():
    medicos = await medico_service.listar_medicos_mock()
    return medicos

@router.put("/{id}", response_model=Medico) #atualiza os dados de um médico existente, identificando-o pelo ID
async def atualizar_medico(id: int, medico_in: MedicoCreate):
    medico_atualizado = await medico_service.atualizar_medico_mock(id, medico_in)
    if medico_atualizado:
        return medico_atualizado
    raise HTTPException(status_code=404, detail="Médico não encontrado")

@router.delete("/{id_medico}", response_model=Medico)
async def inativar_medico(id_medico: int):
    medico_inativado = await medico_service.inativar_medico_mock(id_medico)
    
    if not medico_inativado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Médico não encontrado."
        )
        
    return medico_inativado