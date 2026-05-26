import asyncio
from schemas.paciente import PacienteCreate
from models.paciente import PacienteModel  # Importação corrigida

from schemas.log import LogCreate
from services import log_service

# Banco temporário simulado com instâncias do Modelo
banco_de_pacientes = [
    PacienteModel(
        id=1, 
        nome="Lucas Souza", 
        cpf="111.222.333-44", 
        status="Ativo", 
        responsavel=["Ana Souza"], 
        grupos=["Unimed"]
    ),
    PacienteModel(
        id=2, 
        nome="Beatriz Lima", 
        cpf="555.666.777-88", 
        status="Ativo", 
        responsavel=["Carlos Lima"], 
        grupos=["Bradesco Saúde", "Amil"]
    )
]

async def criar_paciente_mock(paciente_in: PacienteCreate):
    await asyncio.sleep(0.5) 
    
    # Mudado para instanciar o PacienteModel correto
    novo_paciente = PacienteModel(
        id=len(banco_de_pacientes) + 1,
        nome=paciente_in.nome,
        cpf=paciente_in.cpf,
        status=paciente_in.status,
        responsavel=paciente_in.responsavel,
        grupos=paciente_in.grupos
    )
    banco_de_pacientes.append(novo_paciente)

    novo_log = LogCreate(
        entidade="Paciente",
        acao="Criação",
        detalhes=f"O paciente {novo_paciente.nome} (ID: {novo_paciente.id}) foi cadastrado."
    )
    await log_service.criar_log_mock(novo_log)

    return novo_paciente

async def listar_pacientes_mock():
    await asyncio.sleep(0.2)
    return banco_de_pacientes

async def atualizar_paciente_mock(id_paciente: int, paciente_in: PacienteCreate):
    await asyncio.sleep(0.5)

    for paciente in banco_de_pacientes:
        if paciente.id == id_paciente:
            paciente.nome = paciente_in.nome
            paciente.cpf = paciente_in.cpf
            paciente.status = paciente_in.status
            paciente.responsavel = paciente_in.responsavel
            paciente.grupos = paciente_in.grupos

            novo_log = LogCreate(
                entidade="Paciente",
                acao="Atualização",
                detalhes=f"Os dados do paciente {paciente.nome} (ID: {paciente.id}) foram atualizados."
            )
            await log_service.criar_log_mock(novo_log)

            return paciente
    return None

async def inativar_paciente_mock(id_paciente: int):
    await asyncio.sleep(0.5)

    for paciente in banco_de_pacientes:
        if paciente.id == id_paciente:
            paciente.status = "Inativo"

            novo_log = LogCreate(
                entidade="Paciente",
                acao="Inativação",
                detalhes=f"O paciente {paciente.nome} (ID: {paciente.id}) foi inativado."
            )
            await log_service.criar_log_mock(novo_log)
            
            return paciente
    return None