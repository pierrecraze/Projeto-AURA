import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Cole aqui a URL do Session Pooler (IPv4) com a porta 6543 gerada no Supabase!
# Lembre-se de não deixar os colchetes na senha.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.bkjueyessokmhbeyxaho:[postgresql://postgres.bkjueyessokmhbeyxaho:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres]@aws-1-us-east-2.pooler.supabase.com:5432/postgres")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()