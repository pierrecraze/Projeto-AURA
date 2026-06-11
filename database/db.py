import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Obriga o Python a ler o seu arquivo .env (ignorando a memória velha do terminal)
load_dotenv(override=True)

# 2. Pega a URL limpa que você configurou lá no .env (porta 6543)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Trava de segurança para avisar se o .env sumir
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("A DATABASE_URL não foi encontrada. Verifique seu arquivo .env!")

# 3. Cria a conexão
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()