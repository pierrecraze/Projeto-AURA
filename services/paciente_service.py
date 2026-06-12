from datetime import datetime
from sqlalchemy.orm import Session
from schemas.paciente import PacienteCreate, VinculoFamiliarCreate
from models.paciente import PacienteModel, ResponsavelModel, PacienteResponsavelModel, VinculoFamiliarModel
from core.audit import registrar_auditoria

async def listar_pacientes(db: Session, instituicao_id: int = None):
    """Lista pacientes. Se instituicao_id for informado, retorna apenas os
    pacientes daquela instituição — todos os médicos da mesma instituição
    compartilham a visão dos mesmos pacientes."""
    query = db.query(PacienteModel)
    if instituicao_id is not None:
        query = query.filter(PacienteModel.instituicao_id == instituicao_id)
    return query.all()

@registrar_auditoria(entidade="Paciente", acao="Criação")
async def criar_paciente(db: Session, paciente_in: PacienteCreate, instituicao_id: int, cadastrado_por_id: int, *, ator=None):
    novo_paciente = PacienteModel(
        nome=paciente_in.nome,
        cpf=paciente_in.cpf,
        data_nascimento=paciente_in.data_nascimento,
        sexo_biologico=paciente_in.sexo_biologico,
        nome_mae=paciente_in.nome_mae,
        nome_pai=paciente_in.nome_pai,
        cidade=paciente_in.cidade,
        estado=paciente_in.estado,
        pais=paciente_in.pais,
        sintomas=paciente_in.sintomas,
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
                cpf=resp.cpf,
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
        paciente.nome_mae = paciente_in.nome_mae
        paciente.nome_pai = paciente_in.nome_pai
        paciente.cidade = paciente_in.cidade
        paciente.estado = paciente_in.estado
        paciente.pais = paciente_in.pais
        # Só atualiza o checklist se ele veio no payload (não apaga ao editar a ficha)
        if paciente_in.sintomas is not None:
            paciente.sintomas = paciente_in.sintomas

        # Atualiza (ou cria) o responsável principal, se enviado
        if paciente_in.responsaveis:
            resp_in = paciente_in.responsaveis[0]
            vinculo = (
                db.query(PacienteResponsavelModel)
                .filter(PacienteResponsavelModel.paciente_id == paciente.id)
                .first()
            )
            if vinculo:
                vinculo.parentesco = resp_in.parentesco
                responsavel = (
                    db.query(ResponsavelModel)
                    .filter(ResponsavelModel.id == vinculo.responsavel_id)
                    .first()
                )
                if responsavel:
                    responsavel.nome = resp_in.nome
                    responsavel.cpf = resp_in.cpf
                    if resp_in.telefone is not None:
                        responsavel.telefone = resp_in.telefone
            else:
                novo_responsavel = ResponsavelModel(
                    nome=resp_in.nome, cpf=resp_in.cpf, telefone=resp_in.telefone
                )
                db.add(novo_responsavel)
                db.flush()
                db.add(
                    PacienteResponsavelModel(
                        paciente_id=paciente.id,
                        responsavel_id=novo_responsavel.id,
                        parentesco=resp_in.parentesco,
                    )
                )

        db.commit()
        db.refresh(paciente)
        return paciente
    return None

def listar_responsaveis(db: Session, paciente_id):
    """Retorna os responsáveis vinculados ao paciente (para a ficha completa)."""
    registros = (
        db.query(PacienteResponsavelModel, ResponsavelModel)
        .join(ResponsavelModel, ResponsavelModel.id == PacienteResponsavelModel.responsavel_id)
        .filter(PacienteResponsavelModel.paciente_id == paciente_id)
        .all()
    )
    return [
        {
            "nome": resp.nome,
            "parentesco": vinculo.parentesco,
            "cpf": resp.cpf,
            "telefone": resp.telefone,
        }
        for vinculo, resp in registros
    ]

async def atualizar_sintomas(db: Session, id_paciente: str, sintomas: dict):
    """Salva apenas o checklist clínico (formulário de sintomas) do paciente."""
    paciente = db.query(PacienteModel).filter(PacienteModel.id == id_paciente).first()
    if paciente:
        paciente.sintomas = sintomas
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