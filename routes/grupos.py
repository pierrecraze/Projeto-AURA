from fastapi import APIRouter, status, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from schemas.grupo import Grupo, GrupoCreate
from services import grupo_service

from core.security import obter_usuario_atual
from core.audit import obter_ip_cliente
from models.admin import AdminModel
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

@router.post("/", response_model=Grupo, status_code=status.HTTP_201_CREATED)
async def cadastrar_grupo(grupo_in: GrupoCreate, request: Request, db: Session = Depends(get_db), usuario_logado: dict = Depends(obter_usuario_atual)):
    ator = db.query(AdminModel).filter(AdminModel.email == usuario_logado["email"]).first()
    novo_grupo = await grupo_service.criar_grupo(db, grupo_in, ator=ator, ip=obter_ip_cliente(request))
    return novo_grupo

@router.get("/", response_model=list[Grupo]) #devolve a lista de grupos cadastrados
async def listar_grupos(db: Session = Depends(get_db)):
    grupos = await grupo_service.listar_grupos(db)
    return grupos

@router.put("/{id}", response_model=Grupo) #atualiza os dados de um grupo existente, identificando-o pelo ID
async def atualizar_grupo(id: int, grupo_in: GrupoCreate, request: Request, db: Session = Depends(get_db), usuario_logado: dict = Depends(obter_usuario_atual)):
    ator = db.query(AdminModel).filter(AdminModel.email == usuario_logado["email"]).first()
    grupo_atualizado = await grupo_service.atualizar_grupo(db, id, grupo_in, ator=ator, ip=obter_ip_cliente(request))
    if grupo_atualizado:
        return grupo_atualizado
    raise HTTPException(status_code=404, detail="Grupo não encontrado")

@router.delete("/{id_grupo}", response_model=Grupo)
async def inativar_grupo(id_grupo: int, request: Request, db: Session = Depends(get_db), usuario_logado: dict = Depends(obter_usuario_atual)):
    ator = db.query(AdminModel).filter(AdminModel.email == usuario_logado["email"]).first()
    grupo_inativado = await grupo_service.inativar_grupo(db, id_grupo, ator=ator, ip=obter_ip_cliente(request))

    if not grupo_inativado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Grupo não encontrado."
        )
        
    return grupo_inativado

@router.patch("/{id_grupo}/reativar", response_model=Grupo)
async def reativar_grupo(id_grupo: int, request: Request, db: Session = Depends(get_db), usuario_logado: dict = Depends(obter_usuario_atual)):
    ator = db.query(AdminModel).filter(AdminModel.email == usuario_logado["email"]).first()
    grupo_reativado = await grupo_service.reativar_grupo(db, id_grupo, ator=ator, ip=obter_ip_cliente(request))

    if not grupo_reativado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Grupo não encontrado."
        )
        
    return grupo_reativado