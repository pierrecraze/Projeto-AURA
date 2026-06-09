import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Substitua [SUA_SENHA_AQUI] pela senha real do seu banco no Supabase.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:ryvkep-7kaFpe-pedcuagor@db.bkjueyessokmhbeyxaho.supabase.co:5432/postgres")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()