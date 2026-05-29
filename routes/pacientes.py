from fastapi import APIRouter, HTTPException, status, Depends
from schemas.paciente import Paciente, PacienteCreate
from services import paciente_service

from core.security import obter_usuario_atual

# Colocando o cadeado na porta principal do arquivo
router = APIRouter(dependencies=[Depends(obter_usuario_atual)])

@router.post("/", response_model=Paciente, status_code=status.HTTP_201_CREATED)
async def cadastrar_paciente(paciente_in: PacienteCreate):
    novo_paciente = await paciente_service.criar_paciente_mock(paciente_in)
    return novo_paciente

@router.get("/", response_model=list[Paciente])
async def listar_pacientes():
    pacientes = await paciente_service.listar_pacientes_mock()
    return pacientes

@router.put("/{id_paciente}", response_model=Paciente)
async def atualizar_paciente(id_paciente: int, paciente_in: PacienteCreate):
    paciente_atualizado = await paciente_service.atualizar_paciente_mock(id_paciente, paciente_in)
    if paciente_atualizado:
        return paciente_atualizado
    raise HTTPException(status_code=404, detail="Paciente não encontrado")

@router.delete("/{id_paciente}", response_model=Paciente)
async def inativar_paciente(id_paciente: int):
    paciente_inativado = await paciente_service.inativar_paciente_mock(id_paciente)

    if not paciente_inativado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Paciente não encontrado."
        )
        
    return paciente_inativado