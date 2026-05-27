from fastapi import APIRouter
from schemas.dashboard import DashboardResumo
from services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/resumo", response_model=DashboardResumo)
async def obter_resumo_dashboard():
    resumo = await dashboard_service.obter_resumo_mock()
    return resumo