from datetime import datetime
from sqlalchemy.orm import Session
from schemas.paciente import PacienteCreate, VinculoFamiliarCreate
from models.paciente import PacienteModel, ResponsavelModel, PacienteResponsavelModel, VinculoFamiliarModel
from core.audit import registrar_auditoria

async def listar_pacientes(db: Session):
    return db.query(PacienteModel).all()

@registrar_auditoria(entidade="Paciente", acao="Criação")
async def criar_paciente(db: Session, paciente_in: PacienteCreate, instituicao_id: int, cadastrado_por_id: int, *, ator=None):
    novo_paciente = PacienteModel(
        nome=paciente_in.nome,
        cpf=paciente_in.cpf,
        data_nascimento=paciente_in.data_nascimento,
        sexo_biologico=paciente_in.sexo_biologico,
        instituicao_id=instituicao_id,
        cadastrado_por_id=cadastrado_por_id,
        data_cadastro=datetime.utcnow()
    )
    db.add(novo_paciente)
    db.flush() # O "flush" vai no banco, obtém o UUID do paciente recém-criado, mas ainda NÃO finaliza (commit).

    # Se a requisição enviou responsáveis, cadastramos de forma atrelada (em cascata)
    if paciente_in.responsaveis:
        for resp in paciente_in.responsaveis:
            novo_responsavel = ResponsavelModel(
                nome=resp.nome,
                telefone=resp.telefone
            )
            db.add(novo_responsavel)
            db.flush() # Obtém o ID do responsável
            
            # Vincula na tabela pivô
            vinculo = PacienteResponsavelModel(
                paciente_id=novo_paciente.id,
                responsavel_id=novo_responsavel.id,
                parentesco=resp.parentesco
            )
            db.add(vinculo)

    # Se tudo deu certo até aqui, commita (salva de fato) todas as tabelas juntas
    db.commit()
    db.refresh(novo_paciente)

    return novo_paciente

@registrar_auditoria(entidade="Paciente", acao="Atualização")
async def atualizar_paciente(db: Session, id_paciente: str, paciente_in: PacienteCreate, *, ator=None):
    paciente = db.query(PacienteModel).filter(PacienteModel.id == id_paciente).first()
    if paciente:
        paciente.nome = paciente_in.nome
        paciente.cpf = paciente_in.cpf
        paciente.data_nascimento = paciente_in.data_nascimento
        paciente.sexo_biologico = paciente_in.sexo_biologico
        db.commit()
        db.refresh(paciente)
        return paciente
    return None

@registrar_auditoria(entidade="Vínculo Familiar", acao="Criação")
async def vincular_pacientes(db: Session, paciente_origem_id: str, vinculo_in: VinculoFamiliarCreate):
    novo_vinculo = VinculoFamiliarModel(
        paciente_origem_id=paciente_origem_id,
        paciente_destino_id=str(vinculo_in.paciente_destino_id),
        tipo_relacao=vinculo_in.tipo_relacao,
        termo_ref=vinculo_in.termo_ref,
        registrado_por_id=vinculo_in.registrado_por_id,
        instituicao_registradora_id=vinculo_in.instituicao_registradora_id
    )
    db.add(novo_vinculo)
    db.commit()
    db.refresh(novo_vinculo)
    return novo_vinculo

@registrar_auditoria(entidade="Paciente", acao="Inativação")
async def inativar_paciente(db: Session, id_paciente: str):
    paciente = db.query(PacienteModel).filter(PacienteModel.id == id_paciente).first()
    if paciente:
        paciente.deletado_em = datetime.utcnow()
        db.commit()
        db.refresh(paciente)
        return paciente
    return None