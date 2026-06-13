"""Configuração global dos testes.

Os módulos da aplicação importam `database.db`, que cria o engine a partir de
DATABASE_URL já no import. Definimos aqui uma URL fictícia (o engine é lazy — só
conecta quando usado), de modo que os testes unitários rodem sem um banco real e
sem tocar no Supabase de produção.
"""
import os

os.environ.setdefault(
    "DATABASE_URL", "postgresql://teste:teste@localhost:5432/teste"
)
os.environ.setdefault("JWT_SECRET", "segredo-de-teste-pytest")
