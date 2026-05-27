from services import medico_service, paciente_service, grupo_service, log_service
from schemas.dashboard import DashboardResumo

async def obter_resumo_mock():
    # Coletamos as listas de todos os outros serviços
    medicos = await medico_service.listar_medicos_mock()
    pacientes = await paciente_service.listar_pacientes_mock()
    grupos = await grupo_service.listar_grupos_mock()
    logs = await log_service.listar_logs_mock()

    # Montamos o schema de resposta com a contagem (len) de cada lista
    return DashboardResumo(
        total_medicos=len(medicos),
        total_pacientes=len(pacientes),
        total_grupos=len(grupos),
        total_logs=len(logs)
    )