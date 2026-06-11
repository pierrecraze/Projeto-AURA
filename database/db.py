import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Tenta ler a URL do .env. Se o terminal não carregar o .env, 
# usa a nova URL do Pooler do Supabase como garantia.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.ubgmpsxgjiceoagbsiof:IUieqMtuk3qvpq04@aws-1-us-east-1.pooler.supabase.com:6543/postgres")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()