from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routes import grupos, pacientes, medicos, logs, dashboard, triagens, auth

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

@app.get("/api/status")
def status_api():
    return {"status": "Teste API"}

# Incluir as rotas da API
app.include_router(pacientes.router, tags=["Pacientes"])
app.include_router(medicos.router, tags=["Médicos"])
app.include_router(grupos.router, tags=["Grupos"])
app.include_router(logs.router, tags=["Logs"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(triagens.router, tags=["Triagens"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

# Montar os arquivos estáticos
app.mount("/", StaticFiles(directory="static", html=True), name="static")