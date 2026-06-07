from datetime import datetime
from sqlalchemy.orm import Session
from schemas.grupo import GrupoCreate
from models.grupo import GrupoModel

from core.audit import registrar_auditoria

async def listar_grupos(db: Session):
    return db.query(GrupoModel).all()

@registrar_auditoria(entidade="Grupo", acao="Criação")
async def criar_grupo(db: Session, grupo_in: GrupoCreate):
    novo_grupo = GrupoModel(
        nome_fantasia=grupo_in.nome_fantasia,
        cnpj=grupo_in.cnpj,
        cor=grupo_in.cor,
    )
    db.add(novo_grupo)
    db.commit()
    db.refresh(novo_grupo)

    return novo_grupo

@registrar_auditoria(entidade="Grupo", acao="Atualização")
async def atualizar_grupo(db: Session, id_grupo: int, grupo_in: GrupoCreate):
    grupo = db.query(GrupoModel).filter(GrupoModel.id == id_grupo).first()
    if grupo:
        grupo.nome_fantasia = grupo_in.nome_fantasia
        grupo.cnpj = grupo_in.cnpj
        grupo.cor = grupo_in.cor
        db.commit()
        db.refresh(grupo)

        return grupo
    return None

@registrar_auditoria(entidade="Grupo", acao="Inativação")
async def inativar_grupo(db: Session, id_grupo: int):
    grupo = db.query(GrupoModel).filter(GrupoModel.id == id_grupo).first()
    if grupo:
        grupo.deletado_em = datetime.now()
        db.commit()
        db.refresh(grupo)

        return grupo
    return None

@registrar_auditoria(entidade="Grupo", acao="Reativação")
async def reativar_grupo(db: Session, id_grupo: int):
    grupo = db.query(GrupoModel).filter(GrupoModel.id == id_grupo).first()
    if grupo:
        grupo.deletado_em = None
        db.commit()
        db.refresh(grupo)

        return grupo
    return None