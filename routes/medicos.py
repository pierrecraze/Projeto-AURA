from fastapi import APIRouter, status, HTTPException, Depends
from sqlalchemy.orm import Session
from schemas.medico import Medico, MedicoCreate
from services import medico_service

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

@router.post("/", response_model=Medico, status_code=status.HTTP_201_CREATED)
async def cadastrar_medico(medico_in: MedicoCreate, db: Session = Depends(get_db)):
    novo_medico = await medico_service.criar_medico(db, medico_in)
    return novo_medico

@router.get("/", response_model=list[Medico])
async def listar_medicos(db: Session = Depends(get_db)):
    medicos = await medico_service.listar_medicos(db)
    return medicos

@router.put("/{id}", response_model=Medico)
async def atualizar_medico(id: int, medico_in: MedicoCreate, db: Session = Depends(get_db)):
    medico_atualizado = await medico_service.atualizar_medico(db, id, medico_in)
    if medico_atualizado:
        return medico_atualizado
    raise HTTPException(status_code=404, detail="Médico não encontrado")

@router.delete("/{id_medico}", response_model=Medico)
async def inativar_medico(id_medico: int, db: Session = Depends(get_db)):
    medico_inativado = await medico_service.inativar_medico(db, id_medico)
    
    if not medico_inativado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Médico não encontrado."
        )
        
    return medico_inativado