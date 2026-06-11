from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.db import SessionLocal
from core.security import obter_usuario_atual
from models.admin import AdminModel
from schemas.admin import AdminResponse, AdminCreate, AdminUpdate
from services import admin_service

router = APIRouter(dependencies=[Depends(obter_usuario_atual)])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[AdminResponse])
async def listar_admins(db: Session = Depends(get_db)):
    return await admin_service.listar_admins(db)

@router.post("/", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def criar_admin(admin_in: AdminCreate, db: Session = Depends(get_db), usuario_logado_email: str = Depends(obter_usuario_atual)):
    ator = db.query(AdminModel).filter(AdminModel.email == usuario_logado_email).first()
    if not ator:
        raise HTTPException(status_code=403, detail="Usuário ator não encontrado para auditoria.")
    return await admin_service.criar_admin(db, admin_in, ator=ator)

@router.put("/{id_admin}/status", response_model=AdminResponse)
async def alternar_status_admin(id_admin: int, db: Session = Depends(get_db), usuario_logado_email: str = Depends(obter_usuario_atual)):
    ator = db.query(AdminModel).filter(AdminModel.email == usuario_logado_email).first()
    if not ator:
        raise HTTPException(status_code=403, detail="Usuário ator não encontrado para auditoria.")
    admin_atualizado = await admin_service.alternar_status(db, id_admin, ator=ator)
    if not admin_atualizado:
        raise HTTPException(status_code=404, detail="Administrador não encontrado.")
    return admin_atualizado

@router.put("/{id_admin}", response_model=AdminResponse)
async def atualizar_admin(id_admin: int, admin_in: AdminUpdate, db: Session = Depends(get_db), usuario_logado_email: str = Depends(obter_usuario_atual)):
    ator = db.query(AdminModel).filter(AdminModel.email == usuario_logado_email).first()
    if not ator or not ator.is_superadmin:
        raise HTTPException(status_code=403, detail="Apenas super admins podem editar.")
    admin_atualizado = await admin_service.atualizar_admin(db, id_admin, admin_in, ator=ator)
    if not admin_atualizado:
        raise HTTPException(status_code=404, detail="Administrador não encontrado.")
    return admin_atualizado