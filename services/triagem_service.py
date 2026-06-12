import json
from sqlalchemy.orm import Session
from models.triagem import AvaliacaoModel
from schemas.triagem import TriagemCreate

async def listar_triagens(db: Session):
    # Retorna todas as triagens. Os campos sensíveis são filtrados automaticamente pelas rotas.
    return db.query(AvaliacaoModel).all()

async def obter_triagem(db: Session, triagem_id):
    return db.query(AvaliacaoModel).filter(AvaliacaoModel.id == triagem_id).first()

async def excluir_triagem(db: Session, triagem_id):
    """Remove definitivamente uma avaliação registrada."""
    avaliacao = db.query(AvaliacaoModel).filter(AvaliacaoModel.id == triagem_id).first()
    if avaliacao:
        db.delete(avaliacao)
        db.commit()
        return True
    return False

async def atualizar_conduta(db: Session, triagem_id, recomendacao_encaminhamento: bool):
    """Atualiza a conduta (encaminhamento/monitoramento) de uma avaliação já registrada."""
    avaliacao = db.query(AvaliacaoModel).filter(AvaliacaoModel.id == triagem_id).first()
    if avaliacao:
        avaliacao.recomendacao_encaminhamento = recomendacao_encaminhamento
        db.commit()
        db.refresh(avaliacao)
        return avaliacao
    return None

async def criar_triagem(db: Session, triagem_in: TriagemCreate, profissional_id: int):
    nova_avaliacao = AvaliacaoModel(
        paciente_id=triagem_in.paciente_id,
        score_total=triagem_in.score_total,
        recomendacao_encaminhamento=triagem_in.recomendacao_encaminhamento,
        sintomas=json.dumps(triagem_in.sintomas) if triagem_in.sintomas else None,
        profissional_id=profissional_id,
    )
    db.add(nova_avaliacao)
    db.commit()
    db.refresh(nova_avaliacao)
    return nova_avaliacao