from datetime import datetime
from sqlalchemy.orm import Session
from schemas.medico import MedicoCreate
from models.medico import MedicoModel
from core.security import gerar_hash_senha
from core.audit import registrar_auditoria

async def listar_medicos(db: Session):
    return db.query(MedicoModel).all()

@registrar_auditoria(entidade="Médico", acao="Criação")
async def criar_medico(db: Session, medico_in: MedicoCreate):
    novo_medico = MedicoModel(
        nome=medico_in.nome,
        email=medico_in.email,
        cpf=medico_in.cpf,
        crm=medico_in.crm,
        telefone=medico_in.telefone,
        cidade=medico_in.cidade,
        uf=medico_in.uf,
        senha_hash=gerar_hash_senha(medico_in.senha),
        data_nascimento=medico_in.data_nascimento
    )
    db.add(novo_medico)
    db.commit()
    db.refresh(novo_medico)

    return novo_medico

@registrar_auditoria(entidade="Médico", acao="Atualização")
async def atualizar_medico(db: Session, id_medico: int, medico_in: MedicoCreate):
    medico = db.query(MedicoModel).filter(MedicoModel.id == id_medico).first()
    if medico:
        medico.nome = medico_in.nome
        medico.email = medico_in.email
        medico.cpf = medico_in.cpf
        medico.crm = medico_in.crm
        medico.telefone = medico_in.telefone
        medico.cidade = medico_in.cidade
        medico.uf = medico_in.uf
        db.commit()
        db.refresh(medico)

        return medico
    return None

@registrar_auditoria(entidade="Médico", acao="Inativação")
async def inativar_medico(db: Session, id_medico: int):
    medico = db.query(MedicoModel).filter(MedicoModel.id == id_medico).first()
    if medico:
        medico.deletado_em = datetime.now()
        db.commit()
        db.refresh(medico)

        return medico
    return None