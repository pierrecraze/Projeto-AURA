import secrets
import string
from datetime import datetime
from sqlalchemy.orm import Session
from schemas.medico import MedicoCreate, MedicoUpdate
from models.medico import MedicoModel
from models.admin import AdminModel as AdminModelType
from core.audit import registrar_auditoria
from core.security import gerar_hash_senha
from services import grupo_service

async def listar_medicos(db: Session):
    return db.query(MedicoModel).all()

@registrar_auditoria(entidade="Médico", acao="Criação")
async def criar_medico(db: Session, medico_in: MedicoCreate, *, ator: AdminModelType):
    # Define a instituição do médico (padrão, se não informada)
    instituicao_id = medico_in.instituicao_id
    if instituicao_id is None:
        instituicao = await grupo_service.obter_instituicao_padrao(db)
        instituicao_id = instituicao.id

    novo_medico = MedicoModel(
        nome=medico_in.nome,
        email=medico_in.email,
        cpf=medico_in.cpf,
        crm=medico_in.crm,
        telefone=medico_in.telefone,
        cidade=medico_in.cidade,
        uf=medico_in.uf,
        senha_hash=gerar_hash_senha(medico_in.senha),
        data_nascimento=medico_in.data_nascimento,
        instituicao_id=instituicao_id
    )
    db.add(novo_medico)
    db.commit()
    db.refresh(novo_medico)

    return novo_medico

@registrar_auditoria(entidade="Médico", acao="Atualização")
async def atualizar_medico(db: Session, id_medico: int, medico_in: MedicoUpdate, *, ator: AdminModelType):
    medico = db.query(MedicoModel).filter(MedicoModel.id == id_medico).first()
    if medico:
        medico.nome = medico_in.nome
        medico.email = medico_in.email
        medico.cpf = medico_in.cpf
        medico.crm = medico_in.crm
        medico.telefone = medico_in.telefone
        medico.cidade = medico_in.cidade
        medico.uf = medico_in.uf
        if medico_in.instituicao_id is not None:
            medico.instituicao_id = medico_in.instituicao_id
        db.commit()
        db.refresh(medico)

        return medico
    return None

@registrar_auditoria(entidade="Médico", acao="Reset de Senha")
async def resetar_senha_medico(db: Session, id_medico: int):
    medico = db.query(MedicoModel).filter(MedicoModel.id == id_medico).first()
    if not medico:
        return None

    primeiro_nome = medico.nome.split(" ")[0]
    for prefixo in ("Dr.", "Dra.", "Dr", "Dra"):
        if primeiro_nome.startswith(prefixo):
            primeiro_nome = medico.nome.split(" ")[1]
            break
    primeiro_nome = primeiro_nome.capitalize()

    especial = secrets.choice("!@#$*")
    sufixo = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    nova_senha = f"{primeiro_nome}{especial}{sufixo}"

    medico.senha_hash = gerar_hash_senha(nova_senha)
    medico.tentativas_login = 0
    medico.bloqueado_ate = None
    db.commit()
    db.refresh(medico)

    medico.senha_temporaria = nova_senha
    return medico

@registrar_auditoria(entidade="Médico", acao="Inativação")
async def inativar_medico(db: Session, id_medico: int, *, ator: AdminModelType):
    medico = db.query(MedicoModel).filter(MedicoModel.id == id_medico).first()
    if medico:
        medico.deletado_em = datetime.now()
        db.commit()
        db.refresh(medico)

        return medico
    return None

@registrar_auditoria(entidade="Médico", acao="Reativação")
async def reativar_medico(db: Session, id_medico: int, *, ator: AdminModelType):
    medico = db.query(MedicoModel).filter(MedicoModel.id == id_medico).first()
    if medico:
        medico.deletado_em = None
        db.commit()
        db.refresh(medico)

        return medico
    return None