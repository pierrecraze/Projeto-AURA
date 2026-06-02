from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from core.security import verificar_senha, criar_token_jwt, gerar_hash_senha

router = APIRouter()

# Criar senha hash para o usuário admin
senha_hash_admin = gerar_hash_senha("admin123")

# Simulação de banco de dados de usuários
usuarios = {
    "admin@admin.com": {
        "nome": "Admin",
        "email": "admin@admin.com",
        "senha": senha_hash_admin,
        "role": "admin"
    }
}

@router.post("/login", summary="Autenticar usuário e gerar token JWT")
async def realizar_login(credenciais: OAuth2PasswordRequestForm = Depends()):
    # O OAuth2PasswordRequestForm coleta os dados do formulário do Swagger.
    # Ele mapeia o campo 'username' para o e-mail do usuário.
    email_usuario = credenciais.username
    senha_usuario = credenciais.password

    # Verificar se o usuário existe
    usuario_encontrado = usuarios.get(email_usuario)

    if not usuario_encontrado:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="E-mail ou senha inválidos"
        )
    
    # Verificar a senha
    senha_valida = verificar_senha(senha_usuario, usuario_encontrado["senha"])

    if not senha_valida:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos"
        )
    
    # Gerar token JWT
    dados_token = {
        "sub": usuario_encontrado["email"],
    }
    token_gerado = criar_token_jwt(dados_token)

    return {
        "access_token": token_gerado, 
        "token_type": "bearer",
        "usuario": {
            "nome": usuario_encontrado["nome"],
            "email": usuario_encontrado["email"]
        }
    }