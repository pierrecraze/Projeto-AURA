import asyncio
from datetime import datetime

from schemas.log import LogCreate
from schemas.medico import MedicoCreate, Medico
from models.medico import MedicoModel
from core.audit import registrar_auditoria
from services import log_service

class MedicoDatabaseMock:
    """Repositório mock encapsulando o armazenamento (Preparação para SQLAlchemy)"""
    def __init__(self):
        self._banco = [
            MedicoModel(
                id=1, nome="Dr. João Silva", crm="12345", email="joao.silva@hospital.com", 
                status="Ativo", senha="senha123", grupos=["Unimed"], 
                data_cadastro="2026-05-10T08:00:00" # <-- Adicione aqui
            ),
            MedicoModel(
                id=2, nome="Dra. Maria Oliveira", crm="67890", email="maria.oliveira@hospital.com", 
                status="Ativo", senha="senha456", grupos=["Bradesco", "Amil"], 
                data_cadastro="2026-05-12T14:30:00" # <-- Adicione aqui
            )
        ]

    def listar(self):
        return self._banco

    def buscar_por_id(self, id_medico: int):
        return next((m for m in self._banco if m.id == id_medico), None)

    def adicionar(self, medico: MedicoModel):
        self._banco.append(medico)

    def proximo_id(self):
        return max((m.id for m in self._banco), default=0) + 1
        
    def commit(self):
        # Simula o session.commit() do SQLAlchemy
        pass

db = MedicoDatabaseMock()

@registrar_auditoria(entidade="Médico", acao="Criação")
async def criar_medico_mock(medico_in: MedicoCreate):
    await asyncio.sleep(0.5)

    novo_medico = MedicoModel(
        id=db.proximo_id(),
        nome=medico_in.nome,
        crm=medico_in.crm,
        email=medico_in.email,
        status=medico_in.status,
        senha=medico_in.senha,
        grupos=medico_in.grupos,
        data_cadatro=datetime.now().isoformat()
    )
    db.adicionar(novo_medico)
    db.commit()

    return novo_medico

async def listar_medicos_mock():
    await asyncio.sleep(0.2)
    return db.listar()

async def atualizar_medico_mock(id: int, medico_in: MedicoCreate):
    
    await asyncio.sleep(0.5)

    medico = db.buscar_por_id(id)
    if medico:
        medico.nome = medico_in.nome
        medico.crm = medico_in.crm
        medico.email = medico_in.email
        medico.status = medico_in.status
        medico.senha = medico_in.senha
        medico.grupos = medico_in.grupos
        db.commit()

        # O backend registra o que ele acabou de fazer
        novo_log = LogCreate(
            entidade="Médico",
            acao="Atualização",
            detalhes=f"Os dados do médico {medico.nome} (ID: {medico.id}) foram atualizados."
        )
        await log_service.criar_log_mock(novo_log)

        return medico
    return None

async def inativar_medico_mock(id_medico: int): # Inativar um médico (Soft Delete)
    
    await asyncio.sleep(0.5)

    medico = db.buscar_por_id(id_medico)
    if medico:
        # Em vez de apagar, fazemos o Soft Delete
        medico.status = "Inativo"
        db.commit()

        # O backend registra o que ele acabou de fazer
        novo_log = LogCreate(
            entidade="Médico",
            acao="Inativação",
            detalhes=f"O médico {medico.nome} (ID: {medico.id}) foi inativado."
        )
        await log_service.criar_log_mock(novo_log)

        return medico
            
    # Se não achar o médico, retorna vazio
    return None