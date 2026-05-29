import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext

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