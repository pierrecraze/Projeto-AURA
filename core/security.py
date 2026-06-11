import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

secret_key = "chave_secreta_projeto_aura_ibk_muito_segura_2026_oficial"  
algorithm = "HS256"
token_expiration_minutes = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verificar_senha(senha, senha_hash):
    return pwd_context.verify(senha, senha_hash)

def gerar_hash_senha(senha):
    return pwd_context.hash(senha)

def criar_token_jwt(dados: dict):

    dados_copia = dados.copy()
    expiracao = datetime.utcnow() + timedelta(minutes=token_expiration_minutes)
    dados_copia.update({"exp": expiracao})
    token = jwt.encode(dados_copia, secret_key, algorithm=algorithm)

    return token

def obter_usuario_atual(token: str = Depends(oauth2_scheme)):
    """
    Tenta decodificar o token. Se falhar, expulsa o usuário (Erro 401).
    Se der certo, deixa a rota ser executada e devolve o e-mail do usuário logado.
    """
    erro_credenciais = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token ausente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Tenta abrir a pulseira com a nossa Chave Mestra
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        email: str = payload.get("sub")
        id_usuario: int = payload.get("id")
        role: str = payload.get("role")
        
        if email is None:
            raise erro_credenciais
            
        # Retorna um dict com tudo que as rotas precisam saber sobre o usuário
        return {"email": email, "id": id_usuario, "role": role}
        
    except jwt.ExpiredSignatureError:
        # Se passaram os 60 minutos...
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token expirado. Faça login novamente."
        )
    except jwt.InvalidTokenError:
        # Se o hacker tentar inventar um token falso...
        raise erro_credenciais