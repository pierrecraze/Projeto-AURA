import asyncio
from schemas.paciente import PacienteCreate, Paciente

# Nosso "banco" temporário
banco_de_pacientes = []

async def criar_paciente_mock(paciente_in: PacienteCreate):
    # Simula a demora de uma rede ou banco de dados real
    await asyncio.sleep(0.5) 
    
    novo_paciente = Paciente(
        id=len(banco_de_pacientes) + 1,
        nome=paciente_in.nome,
        cpf=paciente_in.cpf,
        status=paciente_in.status
    )
    banco_de_pacientes.append(novo_paciente)
    return novo_paciente

async def listar_pacientes_mock():
    await asyncio.sleep(0.2)
    return banco_de_pacientes