from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.db import SessionLocal
from schemas.triagem import TriagemMetadata
from services import triagem_service
from core.security import obter_usuario_atual

router = APIRouter(prefix="/api/triagens", tags=["Triagens (LGPD)"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[TriagemMetadata], summary="Listar Metadados de Triagens (Acesso Admin)")
async def listar_triagens(db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    """
    Retorna os metadados (quem fez, quando fez, para quem) das triagens de X-Frágil.
    """
    avaliacoes = await triagem_service.listar_triagens(db)
    
    # Mapeia os dados devolvendo 'medico_id' como o front-end espera
    resultados = []
    for av in avaliacoes:
        resultados.append(TriagemMetadata(
            id=av.id, data_hora=av.data_hora, paciente_id=av.paciente_id, medico_id=av.profissional_id
        ))
        
    return resultados