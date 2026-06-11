from sqlalchemy.orm import Session
from models.triagem import AvaliacaoModel
from schemas.triagem import TriagemCreate

async def listar_triagens(db: Session):
    # Retorna todas as triagens. Os campos sensíveis são filtrados automaticamente pelas rotas.
    return db.query(AvaliacaoModel).all()

async def criar_triagem(db: Session, triagem_in: TriagemCreate, profissional_id: int):
    nova_avaliacao = AvaliacaoModel(
        paciente_id=triagem_in.paciente_id,
        score_total=triagem_in.score_total,
        recomendacao_encaminhamento=triagem_in.recomendacao_encaminhamento,
        profissional_id=profissional_id,
    )
    db.add(nova_avaliacao)
    db.commit()
    db.refresh(nova_avaliacao)
    return nova_avaliacao