import asyncio
from datetime import datetime
from schemas.triagem import TriagemCreate
from models.triagem import TriagemModel
from core.audit import registrar_auditoria

class TriagemDatabaseMock:
    """Repositório mock encapsulando o armazenamento (Preparação para SQLAlchemy)"""
    def __init__(self):
        self._banco = [
            TriagemModel(id=i, medico_id=(i%2)+1, paciente_id=i, resultado="Risco Baixo", data_hora=f"2026-05-{10+(i%15):02d}T10:30:00")
            for i in range(1, 13)
        ]

    def listar(self):
        return self._banco

    def buscar_por_id(self, id_triagem: int):
        return next((t for t in self._banco if t.id == id_triagem), None)

    def adicionar(self, triagem: TriagemModel):
        self._banco.append(triagem)

    def remover(self, id_triagem: int):
        for i, t in enumerate(self._banco):
            if t.id == id_triagem:
                return self._banco.pop(i)
        return None

    def proximo_id(self):
        return max((t.id for t in self._banco), default=0) + 1
        
    def commit(self):
        # Simula o session.commit() do SQLAlchemy
        pass

db = TriagemDatabaseMock()

@registrar_auditoria(entidade="Triagem", acao="Criação")
async def criar_triagem_mock(triagem_in: TriagemCreate):
    await asyncio.sleep(0.5)

    nova_triagem = TriagemModel(
        id=db.proximo_id(),
        medico_id=triagem_in.medico_id,
        paciente_id=triagem_in.paciente_id,
        resultado=triagem_in.resultado,
        data_hora=datetime.now().isoformat() # O sistema gera a data exata da triagem
    )
    db.adicionar(nova_triagem)
    db.commit()

    return nova_triagem

async def listar_triagens_mock():
    await asyncio.sleep(0.2)
    return db.listar()

@registrar_auditoria(entidade="Triagem", acao="Atualização")
async def atualizar_triagem_mock(id_triagem: int, triagem_in: TriagemCreate):
    await asyncio.sleep(0.5)

    triagem = db.buscar_por_id(id_triagem)
    if triagem:
        triagem.medico_id = triagem_in.medico_id
        triagem.paciente_id = triagem_in.paciente_id
        triagem.resultado = triagem_in.resultado
        # Obs: A data_hora original da criação não é alterada
        db.commit()

        return triagem
    return None

@registrar_auditoria(entidade="Triagem", acao="Exclusão")
async def deletar_triagem_mock(id_triagem: int):
    # Em registros clínicos reais, geralmente não se apaga, mas incluímos para o CRUD ficar completo
    await asyncio.sleep(0.5)

    triagem_removida = db.remover(id_triagem)
    if triagem_removida:
        db.commit() # Simula a efetivação da exclusão no banco
        
        return triagem_removida
    return None