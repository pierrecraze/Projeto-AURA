import asyncio
from schemas.medico import MedicoCreate, Medico
from models.medico import MedicoModel

banco_de_medicos = [
MedicoModel(
        id=1, 
        nome="Dr. João Silva", 
        crm="12345", 
        email="joao.silva@hospital.com", 
        status="Ativo", 
        senha="senha123", 
        grupos=["Unimed"]
    ),
    MedicoModel(
        id=2, 
        nome="Dra. Maria Oliveira", 
        crm="67890", 
        email="maria.oliveira@hospital.com", 
        status="Ativo", 
        senha="senha456", 
        grupos=["Bradesco", "Amil"]
    )]

async def criar_medico_mock(medico_in: MedicoCreate):
    await asyncio.sleep(0.5)

    novo_id = len(banco_de_medicos) + 1

    novo_medico = MedicoModel(
        id=novo_id,
        nome=medico_in.nome,
        crm=medico_in.crm,
        email=medico_in.email,
        status=medico_in.status,
        senha=medico_in.senha,
        grupos=medico_in.grupos
    )
    banco_de_medicos.append(novo_medico)
    return novo_medico

async def listar_medicos_mock():
    await asyncio.sleep(0.2)
    return banco_de_medicos

async def atualizar_medico_mock(id: int, medico_in: MedicoCreate):
    
    await asyncio.sleep(0.5)

    for medico in banco_de_medicos:
        if medico.id == id:
            medico.nome = medico_in.nome
            medico.crm = medico_in.crm
            medico.email = medico_in.email
            medico.status = medico_in.status
            medico.senha = medico_in.senha
            medico.grupos = medico_in.grupos
            return medico
    return None

async def inativar_medico_mock(id_medico: int): # Inativar um médico (Soft Delete)

    await asyncio.sleep(0.5)

    for medico in banco_de_medicos:
        if medico.id == id_medico:
            # Em vez de apagar, fazemos o Soft Delete
            medico.status = "Inativo"
            return medico
            
    # Se não achar o médico, retorna vazio
    return None