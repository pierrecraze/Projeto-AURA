import os
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

# O seed automático do admin (admin@admin.com / admin123) é só para bootstrap em
# ambiente novo. Em produção mantenha desligado: defina ALLOW_ADMIN_SEED=1 apenas
# quando precisar criar o primeiro admin, e remova depois.
ALLOW_ADMIN_SEED = os.getenv("ALLOW_ADMIN_SEED", "0") == "1"

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

@router.post("/login", summary="Autenticar usuário (Admin ou Médico)")
async def realizar_login(credenciais: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email_usuario = credenciais.username
    senha_usuario = credenciais.password

    # 1. Tenta achar na tabela de ADMIN primeiro
    usuario = db.query(AdminModel).filter(AdminModel.email == email_usuario).first()
    tipo_usuario = "admin"

    # Seed automático do admin (caso o banco esteja vazio) — só se explicitamente
    # habilitado por ALLOW_ADMIN_SEED, para não virar uma porta dos fundos.
    if ALLOW_ADMIN_SEED and not usuario and email_usuario == "admin@admin.com":
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

    # 2. Se NÃO for Admin, tenta achar na tabela de MÉDICO
    if not usuario:
        usuario = db.query(MedicoModel).filter(MedicoModel.email == email_usuario).first()
        tipo_usuario = "medico"

    # 3. Validação de segurança: Existe? A senha bate?
    if not usuario or not verificar_senha(senha_usuario, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos"
        )

    # 4. Regra de negócio: Impede login de médicos deletados/inativados
    if tipo_usuario == "medico" and usuario.deletado_em is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso bloqueado. Conta inativada."
        )
    
    # 5. Cria o Token embutindo o ID e o ROLE (Cargo)
    dados_token = {
        "sub": usuario.email,
        "role": tipo_usuario,
        "id": usuario.id
    }
    token_gerado = criar_token_jwt(dados_token)

    # 6. Monta os dados do usuário para o Front-end
    dados_usuario = {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
    }

    if tipo_usuario == "medico":
        dados_usuario["crm"] = usuario.crm
        dados_usuario["cargo"] = "Profissional de Saúde"
    else:
        dados_usuario["cargo"] = usuario.cargo
        dados_usuario["is_superadmin"] = usuario.is_superadmin

    # 7. Devolve a resposta pronta para o Front-end ler
    return {
        "access_token": token_gerado,
        "token_type": "bearer",
        "role": tipo_usuario,
        "usuario": dados_usuario
    }


@router.put("/perfil", summary="Atualizar dados do perfil do Admin")
async def atualizar_perfil(dados: PerfilUpdate, db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    admin = db.query(AdminModel).filter(AdminModel.email == usuario_logado["email"]).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Administrador não encontrado.")
        
    admin.nome = dados.nome
    admin.email = dados.email
    if dados.cargo and admin.is_superadmin:
        admin.cargo = dados.cargo
    db.commit()
    db.refresh(admin)
    
    # Se o email mudar, o token atual perde validade. Geramos um novo para o frontend atualizar.
    # Inclui role/id como no login, para o token continuar completo.
    novo_token = criar_token_jwt({"sub": admin.email, "role": "admin", "id": admin.id})
    return {"mensagem": "Perfil atualizado", "usuario": {"nome": admin.nome, "email": admin.email, "cargo": admin.cargo, "is_superadmin": admin.is_superadmin}, "access_token": novo_token}

@router.put("/senha", summary="Alterar a senha do usuário logado")
async def atualizar_senha(dados: SenhaUpdate, db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    admin = db.query(AdminModel).filter(AdminModel.email == usuario_logado["email"]).first()

    # Sem isto, um médico chamando esta rota causava 500 (admin == None).
    if not admin:
        raise HTTPException(status_code=404, detail="Administrador não encontrado.")

    if not verificar_senha(dados.senha_atual, admin.senha_hash):
        raise HTTPException(status_code=400, detail="A senha atual está incorreta.")
        
    admin.senha_hash = gerar_hash_senha(dados.nova_senha)
    db.commit()
    return {"mensagem": "Senha alterada com sucesso."}