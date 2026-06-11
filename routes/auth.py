from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database.db import SessionLocal
from models.admin import AdminModel
from models.medico import MedicoModel
from schemas.perfil import PerfilUpdate, SenhaUpdate
from core.security import verificar_senha, criar_token_jwt, gerar_hash_senha, obter_usuario_atual

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

    admin = db.query(AdminModel).filter(AdminModel.email == email_usuario).first()

    # Seed automático: se o banco estiver vazio, ele cadastra o admin padrão automaticamente
    if not admin and email_usuario == "admin@admin.com":
        admin = AdminModel(
            nome="Admin Principal",
            email="admin@admin.com",
            senha_hash=gerar_hash_senha("admin123")
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    if admin:
        if not verificar_senha(senha_usuario, admin.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha inválidos"
            )

        dados_token = {"sub": admin.email, "tipo": "admin"}
        token_gerado = criar_token_jwt(dados_token)

        return {
            "access_token": token_gerado,
            "token_type": "bearer",
            "usuario": {
                "nome": admin.nome,
                "email": admin.email,
                "tipo": "admin"
            }
        }

    medico = db.query(MedicoModel).filter(MedicoModel.email == email_usuario, MedicoModel.deletado_em.is_(None)).first()

    if not medico or not verificar_senha(senha_usuario, medico.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos"
        )

    dados_token = {"sub": medico.email, "tipo": "medico"}
    token_gerado = criar_token_jwt(dados_token)

    return {
        "access_token": token_gerado,
        "token_type": "bearer",
        "usuario": {
            "nome": medico.nome,
            "email": medico.email,
            "tipo": "medico"
        }
    }

@router.put("/perfil", summary="Atualizar dados do perfil do Admin")
async def atualizar_perfil(dados: PerfilUpdate, db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    admin = db.query(AdminModel).filter(AdminModel.email == usuario_logado).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Administrador não encontrado.")
        
    admin.nome = dados.nome
    admin.email = dados.email
    db.commit()
    db.refresh(admin)
    
    # Se o email mudar, o token atual perde validade. Geramos um novo para o frontend atualizar.
    novo_token = criar_token_jwt({"sub": admin.email})
    return {"mensagem": "Perfil atualizado", "usuario": {"nome": admin.nome, "email": admin.email}, "access_token": novo_token}

@router.put("/senha", summary="Alterar a senha do usuário logado")
async def atualizar_senha(dados: SenhaUpdate, db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    admin = db.query(AdminModel).filter(AdminModel.email == usuario_logado).first()
    
    if not verificar_senha(dados.senha_atual, admin.senha_hash):
        raise HTTPException(status_code=400, detail="A senha atual está incorreta.")
        
    admin.senha_hash = gerar_hash_senha(dados.nova_senha)
    db.commit()
    return {"mensagem": "Senha alterada com sucesso."}