from sqlalchemy.orm import Session
from models.admin import AdminModel
from models.admin import AdminModel as AdminModelType
from schemas.admin import AdminCreate, AdminUpdate
from core.security import gerar_hash_senha
from core.audit import registrar_auditoria

async def listar_admins(db: Session):
    return db.query(AdminModel).order_by(AdminModel.id.desc()).all()

@registrar_auditoria(entidade="Admin", acao="Criação")
async def criar_admin(db: Session, admin_in: AdminCreate, *, ator: AdminModelType):
    novo_admin = AdminModel(
        nome=admin_in.nome,
        email=admin_in.email,
        senha_hash=gerar_hash_senha(admin_in.senha),
        status="Ativo",
        is_superadmin=admin_in.is_superadmin,
        cargo=admin_in.cargo
    )
    db.add(novo_admin)
    db.commit()
    db.refresh(novo_admin)
    return novo_admin

@registrar_auditoria(entidade="Admin", acao="Atualização de Status")
async def alternar_status(db: Session, id_admin: int, *, ator: AdminModelType):
    admin = db.query(AdminModel).filter(AdminModel.id == id_admin).first()
    if admin:
        admin.status = "Inativo" if admin.status == "Ativo" else "Ativo"
        db.commit()
        db.refresh(admin)
    return admin

@registrar_auditoria(entidade="Admin", acao="Atualização")
async def atualizar_admin(db: Session, id_admin: int, admin_in: AdminUpdate, *, ator: AdminModelType):
    admin = db.query(AdminModel).filter(AdminModel.id == id_admin).first()
    if admin:
        admin.nome = admin_in.nome
        admin.email = admin_in.email
        admin.cargo = admin_in.cargo
        admin.is_superadmin = admin_in.is_superadmin
        db.commit()
        db.refresh(admin)
    return admin