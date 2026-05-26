from fastapi import APIRouter, status
from schemas.paciente import Paciente, PacienteCreate
from services import paciente_service

router = APIRouter(prefix="/api/pacientes", tags=["Pacientes"])

@router.post("/", response_model=Paciente, status_code=status.HTTP_201_CREATED)
async def cadastrar_paciente(paciente_in: PacienteCreate):
    novo_paciente = await paciente_service.criar_paciente_mock(paciente_in)
    return novo_paciente

@router.get("/", response_model=list[Paciente])
async def listar_pacientes():
    pacientes = await paciente_service.listar_pacientes_mock()
    return pacientes