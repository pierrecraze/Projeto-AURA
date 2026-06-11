import sys
import os
# Força o Python a enxergar a raiz do projeto (Projeto-AURA) na hora de importar módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routes import grupos, pacientes, medicos, logs, dashboard, triagens, auth

# --- Configuração do Banco de Dados ---
from database.db import engine, Base
from models.admin import AdminModel # Importa o modelo para o SQLAlchemy conhecê-lo
Base.metadata.create_all(bind=engine) # Cria a tabela admin_sistema automaticamente se não existir

# Inicialização do Aplicativo
app = FastAPI(
    title="API Projeto AURA",
    description="Backend para o sistema de triagem clínica do IBK",
    version="1.0.0"
)

# Configuração de CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

# Servir arquivos estáticos
# Servir arquivos estáticos
app.mount("/core", StaticFiles(directory="core"), name="core")  # ← adiciona essa
app.mount("/", StaticFiles(directory="static", html=True), name="static")