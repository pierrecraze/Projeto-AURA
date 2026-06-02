import asyncio
from datetime import datetime
from schemas.triagem import TriagemCreate
from models.triagem import TriagemModel
from schemas.log import LogCreate
from services import log_service

# Banco de dados fictício com algumas triagens para alimentar seu dashboard
banco_de_triagens = [
    TriagemModel(id=i, medico_id=(i%2)+1, paciente_id=i, resultado="Risco Baixo", data_hora=f"2026-05-{10+(i%15):02d}T10:30:00")
    for i in range(1, 13)
]

async def criar_triagem_mock(triagem_in: TriagemCreate):
    await asyncio.sleep(0.5)

    novo_id = len(banco_de_triagens) + 1

    nova_triagem = TriagemModel(
        id=novo_id,
        medico_id=triagem_in.medico_id,
        paciente_id=triagem_in.paciente_id,
        resultado=triagem_in.resultado,
        data_hora=datetime.now().isoformat() # O sistema gera a data exata da triagem
    )
    banco_de_triagens.append(nova_triagem)

    # Registro no Log
    novo_log = LogCreate(
        entidade="Triagem",
        acao="Criação",
        detalhes=f"Triagem (ID: {nova_triagem.id}) registrada para o paciente ID {nova_triagem.paciente_id} pelo médico ID {nova_triagem.medico_id}."
    )
    await log_service.criar_log_mock(novo_log)

    return nova_triagem

async def listar_triagens_mock():
    await asyncio.sleep(0.2)
    return banco_de_triagens

async def atualizar_triagem_mock(id_triagem: int, triagem_in: TriagemCreate):
    await asyncio.sleep(0.5)

    for triagem in banco_de_triagens:
        if triagem.id == id_triagem:
            triagem.medico_id = triagem_in.medico_id
            triagem.paciente_id = triagem_in.paciente_id
            triagem.resultado = triagem_in.resultado
            # Obs: A data_hora original da criação não é alterada

            # Registro no Log
            novo_log = LogCreate(
                entidade="Triagem",
                acao="Atualização",
                detalhes=f"O resultado da Triagem (ID: {triagem.id}) foi atualizado."
            )
            await log_service.criar_log_mock(novo_log)

            return triagem
    return None

async def deletar_triagem_mock(id_triagem: int):
    # Em registros clínicos reais, geralmente não se apaga, mas incluímos para o CRUD ficar completo
    await asyncio.sleep(0.5)

    for i, triagem in enumerate(banco_de_triagens):
        if triagem.id == id_triagem:
            triagem_removida = banco_de_triagens.pop(i)

            # Registro no Log
            novo_log = LogCreate(
                entidade="Triagem",
                acao="Exclusão",
                detalhes=f"A Triagem (ID: {triagem_removida.id}) foi excluída do sistema."
            )
            await log_service.criar_log_mock(novo_log)

            return triagem_removida
    return None