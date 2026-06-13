from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from schemas.paciente import Paciente, PacienteCreate, VinculoFamiliar, VinculoFamiliarCreate, SintomasUpdate
from services import paciente_service, grupo_service
from models.paciente import PacienteModel
from models.medico import MedicoModel
from models.admin import AdminModel
from uuid import UUID

from core.security import obter_usuario_atual
from core.audit import obter_ip_cliente
from database.db import SessionLocal


def resolver_ator(db: Session, usuario_logado: dict):
    """Resolve o modelo do autor da ação (médico ou admin) a partir do token,
    para a auditoria registrar quem realmente fez a operação."""
    email = usuario_logado.get("email")
    medico = db.query(MedicoModel).filter(MedicoModel.email == email).first()
    if medico:
        return medico
    return db.query(AdminModel).filter(AdminModel.email == email).first()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Cadeado na porta principal — todas as rotas exigem login
router = APIRouter(dependencies=[Depends(obter_usuario_atual)])


def carregar_paciente_autorizado(db: Session, id_paciente, usuario_logado: dict) -> PacienteModel:
    """Carrega um paciente garantindo que o usuário tem direito de vê-lo.

    Admin acessa qualquer paciente; o médico só acessa os da SUA instituição.
    Para acesso fora da instituição devolve 404 (e não 403) de propósito: assim
    não revelamos sequer a existência do paciente a quem não deveria vê-lo.
    """
    paciente = db.query(PacienteModel).filter(PacienteModel.id == id_paciente).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    if usuario_logado.get("role") == "admin":
        return paciente

    medico = db.query(MedicoModel).filter(MedicoModel.email == usuario_logado.get("email")).first()
    if not medico or paciente.instituicao_id != medico.instituicao_id:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return paciente

@router.post("/", response_model=Paciente, status_code=status.HTTP_201_CREATED)
async def cadastrar_paciente(paciente_in: PacienteCreate, request: Request, db: Session = Depends(get_db), usuario_logado_email: str = Depends(obter_usuario_atual)):
    medico = db.query(MedicoModel).filter(MedicoModel.email == usuario_logado_email["email"]).first()
    if not medico:
        raise HTTPException(status_code=403, detail="Apenas profissionais de saúde podem cadastrar pacientes.")

    # O paciente entra na instituição do médico (compartilhado com os colegas).
    # Fallback para a instituição padrão se o médico ainda não tiver uma.
    if medico.instituicao_id is None:
        instituicao = await grupo_service.obter_instituicao_padrao(db)
        medico.instituicao_id = instituicao.id
        db.commit()

    novo_paciente = await paciente_service.criar_paciente(
        db, paciente_in, instituicao_id=medico.instituicao_id, cadastrado_por_id=medico.id,
        ator=medico, ip=obter_ip_cliente(request)
    )
    return novo_paciente

@router.get("/", response_model=list[Paciente])
async def listar_pacientes(
    db: Session = Depends(get_db),
    usuario_logado: dict = Depends(obter_usuario_atual)
):
    role = usuario_logado.get("role")

    # Admin vê todos os pacientes
    if role == "admin":
        return await paciente_service.listar_pacientes(db, instituicao_id=None)

    # Médico vê os pacientes da SUA instituição (compartilhados entre colegas)
    medico = db.query(MedicoModel).filter(MedicoModel.email == usuario_logado.get("email")).first()
    if not medico:
        raise HTTPException(status_code=403, detail="Usuário não é um profissional de saúde válido.")

    # Garantia para médicos antigos ainda sem instituição: entra na padrão
    if medico.instituicao_id is None:
        instituicao = await grupo_service.obter_instituicao_padrao(db)
        medico.instituicao_id = instituicao.id
        db.commit()

    return await paciente_service.listar_pacientes(db, instituicao_id=medico.instituicao_id)

@router.get("/{id_paciente}", response_model=Paciente)
async def obter_paciente(id_paciente: UUID, db: Session = Depends(get_db), usuario_logado: dict = Depends(obter_usuario_atual)):
    paciente = carregar_paciente_autorizado(db, id_paciente, usuario_logado)
    # Anexa os responsáveis vinculados para a ficha completa do front-end
    paciente.responsaveis = paciente_service.listar_responsaveis(db, paciente.id)
    return paciente

@router.put("/{id_paciente}", response_model=Paciente)
async def atualizar_paciente(id_paciente: UUID, paciente_in: PacienteCreate, request: Request, db: Session = Depends(get_db), usuario_logado: dict = Depends(obter_usuario_atual)):
    # Garante que o usuário só edita pacientes que tem direito de ver
    carregar_paciente_autorizado(db, id_paciente, usuario_logado)
    ator = resolver_ator(db, usuario_logado)
    paciente_atualizado = await paciente_service.atualizar_paciente(db, str(id_paciente), paciente_in, ator=ator, ip=obter_ip_cliente(request))
    if paciente_atualizado:
        paciente_atualizado.responsaveis = paciente_service.listar_responsaveis(db, paciente_atualizado.id)
        return paciente_atualizado
    raise HTTPException(status_code=404, detail="Paciente não encontrado")

@router.patch("/{id_paciente}/sintomas", response_model=Paciente)
async def atualizar_sintomas_paciente(id_paciente: UUID, dados: SintomasUpdate, db: Session = Depends(get_db), usuario_logado: dict = Depends(obter_usuario_atual)):
    """Salva apenas o formulário clínico (checklist de sintomas) do paciente."""
    carregar_paciente_autorizado(db, id_paciente, usuario_logado)
    paciente = await paciente_service.atualizar_sintomas(db, str(id_paciente), dados.sintomas)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return paciente

@router.delete("/{id_paciente}", response_model=Paciente)
async def inativar_paciente(id_paciente: UUID, request: Request, db: Session = Depends(get_db), usuario_logado: dict = Depends(obter_usuario_atual)):
    carregar_paciente_autorizado(db, id_paciente, usuario_logado)
    ator = resolver_ator(db, usuario_logado)
    paciente_inativado = await paciente_service.inativar_paciente(db, str(id_paciente), ator=ator, ip=obter_ip_cliente(request))
    if not paciente_inativado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado."
        )
    return paciente_inativado

@router.post("/{id_paciente}/vincular", response_model=VinculoFamiliar, status_code=status.HTTP_201_CREATED)
async def vincular_familiar(id_paciente: UUID, vinculo_in: VinculoFamiliarCreate, request: Request, db: Session = Depends(get_db), usuario_logado: dict = Depends(obter_usuario_atual)):
    # Só pode vincular pacientes a partir de um paciente que o usuário acessa
    carregar_paciente_autorizado(db, id_paciente, usuario_logado)
    if id_paciente == vinculo_in.paciente_destino_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível vincular um paciente a si mesmo."
        )
    ator = resolver_ator(db, usuario_logado)
    novo_vinculo = await paciente_service.vincular_pacientes(db, str(id_paciente), vinculo_in, ator=ator, ip=obter_ip_cliente(request))
    return novo_vinculo