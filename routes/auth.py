from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database.db import SessionLocal
from models.admin import AdminModel
from models.medico import MedicoModel
from schemas.perfil import SenhaUpdate
from core.security import verificar_senha, criar_token_jwt, gerar_hash_senha, obter_usuario_atual
from pydantic import BaseModel, EmailStr
from typing import Optional

class PerfilUpdate(BaseModel):
    nome: str
    email: EmailStr
    cargo: Optional[str] = None

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", summary="Autenticar usuário e gerar token JWT")
async def realizar_login(credenciais: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email_usuario = credenciais.username
    senha_usuario = credenciais.password

    # 1. Tenta achar na tabela de Admins
    usuario = db.query(AdminModel).filter(AdminModel.email == email_usuario).first()
    is_medico = False

    # Seed automático: se o banco estiver vazio, ele cadastra o admin padrão automaticamente
    if not usuario and email_usuario == "admin@admin.com":
        usuario = AdminModel(
            nome="Admin Principal",
            email="admin@admin.com",
            senha_hash=gerar_hash_senha("admin123"),
            is_superadmin=True,
            cargo="Super Administrador"
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    # 2. Se não achou admin, tenta na tabela de Médicos
    if not usuario:
        usuario = db.query(MedicoModel).filter(MedicoModel.email == email_usuario).first()
        is_medico = True

    # 3. Se não achou em nenhuma das duas tabelas
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="E-mail ou senha inválidos"
        )
    
    # 4. Verifica a senha e prossegue
    if not verificar_senha(senha_usuario, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos"
        )
    
    dados_token = {"sub": usuario.email}
    token_gerado = criar_token_jwt(dados_token)

    dados_usuario = {
        "nome": usuario.nome,
        "email": usuario.email,
    }
    
    if is_medico:
        dados_usuario["crm"] = usuario.crm
        dados_usuario["cargo"] = "Profissional de Saúde"
    else:
        dados_usuario["cargo"] = usuario.cargo
        dados_usuario["is_superadmin"] = usuario.is_superadmin

    return {
        "access_token": token_gerado, 
        "token_type": "bearer",
        "usuario": dados_usuario
    }

@router.put("/perfil", summary="Atualizar dados do perfil do Admin")
async def atualizar_perfil(dados: PerfilUpdate, db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    admin = db.query(AdminModel).filter(AdminModel.email == usuario_logado).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Administrador não encontrado.")
        
    admin.nome = dados.nome
    admin.email = dados.email
    if dados.cargo and admin.is_superadmin:
        admin.cargo = dados.cargo
    db.commit()
    db.refresh(admin)
    
    # Se o email mudar, o token atual perde validade. Geramos um novo para o frontend atualizar.
    novo_token = criar_token_jwt({"sub": admin.email})
    return {"mensagem": "Perfil atualizado", "usuario": {"nome": admin.nome, "email": admin.email, "cargo": admin.cargo, "is_superadmin": admin.is_superadmin}, "access_token": novo_token}

@router.put("/senha", summary="Alterar a senha do usuário logado")
async def atualizar_senha(dados: SenhaUpdate, db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    admin = db.query(AdminModel).filter(AdminModel.email == usuario_logado).first()
    
    if not verificar_senha(dados.senha_atual, admin.senha_hash):
        raise HTTPException(status_code=400, detail="A senha atual está incorreta.")
        
    admin.senha_hash = gerar_hash_senha(dados.nova_senha)
    db.commit()
    return {"mensagem": "Senha alterada com sucesso."}