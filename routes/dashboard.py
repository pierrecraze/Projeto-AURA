from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas.dashboard import DashboardResumo
from services import dashboard_service
from database.db import SessionLocal

from core.security import obter_usuario_atual

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/resumo", summary="Resumo do Dashboard", response_model=DashboardResumo)
async def obter_resumo_dashboard(db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    return await dashboard_service.obter_resumo(db)