from sqlalchemy.orm import Session
from models.triagem import AvaliacaoModel

async def listar_triagens(db: Session):
    # Retorna todas as triagens. Os campos sensíveis são filtrados automaticamente pelas rotas.
    return db.query(AvaliacaoModel).all()