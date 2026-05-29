from fastapi import APIRouter, Depends
from schemas.dashboard import DashboardResumo
from services import dashboard_service

from core.security import obter_usuario_atual

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/resumo", summary="Resumo do Dashboard")
def obter_resumo_dashboard(usuario_logado: str = Depends(obter_usuario_atual)):
    print(f"O usuário {usuario_logado} acessou o Dashboard.")
        
        # ... aqui continua a sua lógica matemática e o return dos dados ...
    return {
            "total_grupos": 5,
            "total_medicos": 12,
            # ... resto dos seus dados
        }