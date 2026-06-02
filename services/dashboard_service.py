from datetime import datetime
from services import medico_service, paciente_service, grupo_service, triagem_service
from schemas.dashboard import DashboardResumo

async def obter_resumo_mock():
    # Coleta todos os dados das outras APIs
    medicos = await medico_service.listar_medicos_mock()
    pacientes = await paciente_service.listar_pacientes_mock()
    grupos = await grupo_service.listar_grupos_mock()
    triagens = await triagem_service.listar_triagens_mock()

    agora = datetime.now()
    mes_atual = agora.month
    ano_atual = agora.year

    # Função auxiliar para verificar se o cadastro ocorreu no mês atual
    def eh_deste_mes(data_iso: str):
        if not data_iso: # Se a data for None ou vazia, consideramos que não é deste mês
            return False
        data_obj = datetime.fromisoformat(data_iso) # Converte a string ISO para um objeto datetime
        return data_obj.month == mes_atual and data_obj.year == ano_atual

    # Calcula quantos foram criados apenas no mês atual
    medicos_mes = sum(
        1 for m in medicos  
        if eh_deste_mes(m.data_cadastro))
    
    pacientes_mes = sum(
        1 for p in pacientes 
        if eh_deste_mes(p.data_cadastro))
    
    triagens_mes = sum(
        1 for t in triagens 
        if eh_deste_mes(t.data_hora))

    # Dados simulados para o gráfico (12 meses) para dar o efeito visual no Front
    grafico = [65, 80, 92, 110, 85, 120, 140, 130, 155, 165, 145, 160]

    return DashboardResumo(
        total_medicos=len(medicos),
        medicos_mes=medicos_mes,
        total_pacientes=len(pacientes),
        pacientes_mes=pacientes_mes,
        total_grupos=len(grupos),
        total_triagens=len(triagens),
        triagens_mes=triagens_mes,
        grafico_triagens=grafico
    )