import asyncio
from datetime import datetime

from schemas.paciente import PacienteCreate
from models.paciente import PacienteModel
from core.audit import registrar_auditoria # 1. Importamos o decorador aqui em cima

banco_de_pacientes = [
   PacienteModel(

        id=1, nome="Lucas Souza", cpf="111.222.333-44", status="Ativo",
        responsavel=["Ana Souza"], grupos=["Unimed"],
        data_cadastro="2026-05-01T09:00:00"),

    PacienteModel(
        id=2, nome="Beatriz Lima", cpf="555.666.777-88", status="Ativo",
        responsavel=["Carlos Lima"], grupos=["Bradesco Saúde", "Amil"],
        data_cadastro="2026-05-05T15:00:00")
]

# 2. Colocamos o decorador avisando o que essa função faz
@registrar_auditoria(entidade="Paciente", acao="Criação")
async def criar_paciente_mock(paciente_in: PacienteCreate):
    await asyncio.sleep(0.5) 
    
    # 3. A função faz EXCLUSIVAMENTE o trabalho dela (lidar com os dados)
    novo_paciente = PacienteModel(
        id=len(banco_de_pacientes) + 1,
        nome=paciente_in.nome,
        cpf=paciente_in.cpf,
        status=paciente_in.status,
        responsavel=paciente_in.responsavel,
        grupos=paciente_in.grupos,
        data_cadastro=datetime.now().isoformat()
    )
    banco_de_pacientes.append(novo_paciente)

    # APAGAMOS todo o bloco do LogCreate que ficava aqui!

    return novo_paciente

@registrar_auditoria(entidade="Paciente", acao="Listar")
async def listar_pacientes_mock():
    await asyncio.sleep(0.2)
    return banco_de_pacientes

@registrar_auditoria(entidade="Paciente", acao="Atualização")
async def atualizar_paciente_mock(id_paciente: int, paciente_in: PacienteCreate):
    await asyncio.sleep(0.5)
    
    paciente = next((p for p in banco_de_pacientes if p.id == id_paciente), None)
    if paciente:
        paciente.nome = paciente_in.nome
        paciente.cpf = paciente_in.cpf
        paciente.status = paciente_in.status
        paciente.responsavel = paciente_in.responsavel
        paciente.grupos = paciente_in.grupos
        return paciente
    return None

@registrar_auditoria(entidade="Paciente", acao="Inativação")
async def inativar_paciente_mock(id_paciente: int):
    await asyncio.sleep(0.5)
    
    paciente = next((p for p in banco_de_pacientes if p.id == id_paciente), None)
    if paciente:
        paciente.status = "Inativo"
        return paciente
    return None