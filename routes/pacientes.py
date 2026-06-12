from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from schemas.paciente import Paciente, PacienteCreate, VinculoFamiliar, VinculoFamiliarCreate
from services import paciente_service, grupo_service
from models.paciente import PacienteModel
from models.medico import MedicoModel
from uuid import UUID

from core.security import obter_usuario_atual
from database.db import SessionLocal

# Dependência para obter a sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Colocando o cadeado na porta principal do arquivo
router = APIRouter(dependencies=[Depends(obter_usuario_atual)])

@router.post("/", response_model=Paciente, status_code=status.HTTP_201_CREATED)
async def cadastrar_paciente(paciente_in: PacienteCreate, db: Session = Depends(get_db), usuario_logado_email: str = Depends(obter_usuario_atual)):
    medico = db.query(MedicoModel).filter(MedicoModel.email == usuario_logado_email).first()
    if not medico:
        raise HTTPException(status_code=403, detail="Apenas profissionais de saúde podem cadastrar pacientes.")

    instituicao = await grupo_service.obter_instituicao_padrao(db)

    novo_paciente = await paciente_service.criar_paciente(
        db, paciente_in, instituicao_id=instituicao.id, cadastrado_por_id=medico.id, ator=medico
    )
    return novo_paciente

@router.get("/", response_model=list[Paciente])
async def listar_pacientes(db: Session = Depends(get_db)):
    pacientes = await paciente_service.listar_pacientes(db)
    return pacientes

@router.get("/{id_paciente}", response_model=Paciente)
async def obter_paciente(id_paciente: UUID, db: Session = Depends(get_db)):
    paciente = db.query(PacienteModel).filter(PacienteModel.id == id_paciente).first()
    if paciente:
        return paciente
    raise HTTPException(status_code=404, detail="Paciente não encontrado")

@router.put("/{id_paciente}", response_model=Paciente)
async def atualizar_paciente(id_paciente: UUID, paciente_in: PacienteCreate, db: Session = Depends(get_db), usuario_logado_email: str = Depends(obter_usuario_atual)):
    medico = db.query(MedicoModel).filter(MedicoModel.email == usuario_logado_email).first()
    paciente_atualizado = await paciente_service.atualizar_paciente(db, str(id_paciente), paciente_in, ator=medico)
    if paciente_atualizado:
        return paciente_atualizado
    raise HTTPException(status_code=404, detail="Paciente não encontrado")

@router.delete("/{id_paciente}", response_model=Paciente)
async def inativar_paciente(id_paciente: UUID, db: Session = Depends(get_db)):
    paciente_inativado = await paciente_service.inativar_paciente(db, str(id_paciente))

    if not paciente_inativado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Paciente não encontrado."
        )
        
    return paciente_inativado

@router.post("/{id_paciente}/vincular", response_model=VinculoFamiliar, status_code=status.HTTP_201_CREATED)
async def vincular_familiar(id_paciente: UUID, vinculo_in: VinculoFamiliarCreate, db: Session = Depends(get_db)):
    if id_paciente == vinculo_in.paciente_destino_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Não é possível vincular um paciente a si mesmo."
        )
    novo_vinculo = await paciente_service.vincular_pacientes(db, str(id_paciente), vinculo_in)
    return novo_vinculo