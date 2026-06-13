import sys
import os
# Força o Python a enxergar a raiz do projeto (Projeto-AURA) na hora de importar módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routes import grupos, pacientes, medicos, logs, dashboard, triagens, auth, admins

# --- Configuração do Banco de Dados ---
from database.db import engine, Base
from models.admin import AdminModel # Importa o modelo para o SQLAlchemy conhecê-lo

# create_all cria as tabelas que faltam (bootstrap em deploy serverless, onde não
# há etapa de migração). Mudanças de schema (novas colunas etc.) agora são feitas
# por migrações versionadas com Alembic — ver pasta migrations/ e migrations/README.
# (O antigo bloco de "ALTER TABLE ... IF NOT EXISTS" foi removido: os models já
#  declaram todas essas colunas, então create_all as cria num banco novo.)
Base.metadata.create_all(bind=engine)

# Inicialização do Aplicativo
app = FastAPI(
    title="API Projeto AURA",
    description="Backend para o sistema de triagem clínica do IBK",
    version="1.0.0"
)

# Configuração de CORS (Cross-Origin Resource Sharing)
# Por padrão libera tudo (dev). Em produção, defina CORS_ORIGINS com a lista de
# origens permitidas separadas por vírgula, ex.: "https://app.ibk.org.br".
_cors_env = os.getenv("CORS_ORIGINS", "*").strip()
cors_origins = ["*"] if _cors_env == "*" else [o.strip() for o in _cors_env.split(",") if o.strip()]
# `allow_credentials=True` com origin "*" é inválido pelo padrão CORS; como a API
# usa token Bearer (não cookies), só habilitamos credenciais quando há lista fixa.
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=(cors_origins != ["*"]),
    allow_methods=["*"], # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],
)

# Incluir as rotas da API
app.include_router(pacientes.router, prefix="/api/pacientes", tags=["Pacientes"])
app.include_router(medicos.router, prefix="/api/medicos", tags=["Médicos"])
app.include_router(grupos.router, prefix="/api/grupos", tags=["Grupos"])
app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
app.include_router(dashboard.router)
app.include_router(triagens.router)
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(admins.router, prefix="/api/admins", tags=["Administradores"])

# Servir arquivos estáticos
app.mount("/core", StaticFiles(directory="core"), name="core")
app.mount("/", StaticFiles(directory="static", html=True), name="static")