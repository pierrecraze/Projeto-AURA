import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.db import SessionLocal
from schemas.triagem import TriagemMetadata, TriagemResumo, TriagemCondutaUpdate, TriagemDetalhe, TriagemCreate
from services import triagem_service
from models.medico import MedicoModel
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


# IMPORTANTE: declarado antes de "/{triagem_id}" para a rota fixa ter prioridade
@router.get("/resumo", response_model=List[TriagemResumo], summary="Listar Avaliações com Score (Profissional)")
async def listar_triagens_resumo(db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    """
    Retorna as avaliações com score e conduta — usado na página de Avaliações
    do profissional de saúde.
    """
    avaliacoes = await triagem_service.listar_triagens(db)
    return [
        TriagemResumo(
            id=av.id,
            data_hora=av.data_hora,
            paciente_id=av.paciente_id,
            medico_id=av.profissional_id,
            score_total=av.score_total,
            recomendacao_encaminhamento=av.recomendacao_encaminhamento,
        )
        for av in avaliacoes
    ]


@router.patch("/{triagem_id}", response_model=TriagemMetadata, summary="Atualizar Conduta da Avaliação")
async def atualizar_conduta_triagem(triagem_id: UUID, dados: TriagemCondutaUpdate, db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    """
    Atualiza a conduta (encaminhamento para FMR1 ou monitoramento) de uma
    avaliação já registrada.
    """
    av = await triagem_service.atualizar_conduta(db, triagem_id, dados.recomendacao_encaminhamento)
    if not av:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")
    return TriagemMetadata(
        id=av.id, data_hora=av.data_hora, paciente_id=av.paciente_id, medico_id=av.profissional_id
    )


@router.delete("/{triagem_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Excluir Avaliação")
async def excluir_triagem(triagem_id: UUID, db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    """Remove definitivamente uma avaliação registrada."""
    removido = await triagem_service.excluir_triagem(db, triagem_id)
    if not removido:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")


@router.get("/{triagem_id}", response_model=TriagemDetalhe, summary="Detalhar Avaliação (Relatório)")
async def detalhar_triagem(triagem_id: UUID, db: Session = Depends(get_db), usuario_logado: str = Depends(obter_usuario_atual)):
    """
    Retorna os dados completos de uma avaliação (score, sintomas assinalados e conduta),
    usados pelo profissional de saúde para gerar o relatório PDF.
    """
    av = await triagem_service.obter_triagem(db, triagem_id)
    if not av:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")

    medico = db.query(MedicoModel).filter(MedicoModel.id == av.profissional_id).first()

    try:
        sintomas = json.loads(av.sintomas) if av.sintomas else None
    except (TypeError, ValueError):
        sintomas = None

    return TriagemDetalhe(
        id=av.id,
        data_hora=av.data_hora,
        paciente_id=av.paciente_id,
        medico_id=av.profissional_id,
        score_total=av.score_total,
        recomendacao_encaminhamento=av.recomendacao_encaminhamento,
        sintomas=sintomas,
        medico_nome=medico.nome if medico else None,
        medico_crm=medico.crm if medico else None,
    )


@router.post("/", response_model=TriagemMetadata, status_code=status.HTTP_201_CREATED, summary="Registrar Avaliação de Triagem")
async def criar_triagem(triagem_in: TriagemCreate, db: Session = Depends(get_db), usuario_logado_email: str = Depends(obter_usuario_atual)):
    """
    Registra o resultado de uma avaliação clínica (formulário X-Frágil) realizada pelo médico logado.
    """
    medico = db.query(MedicoModel).filter(MedicoModel.email == usuario_logado_email).first()
    if not medico:
        raise HTTPException(status_code=403, detail="Usuário não é um profissional de saúde válido.")

    nova_avaliacao = await triagem_service.criar_triagem(db, triagem_in, profissional_id=medico.id)

    return TriagemMetadata(
        id=nova_avaliacao.id,
        data_hora=nova_avaliacao.data_hora,
        paciente_id=nova_avaliacao.paciente_id,
        medico_id=nova_avaliacao.profissional_id,
    )