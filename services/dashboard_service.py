from datetime import datetime
from sqlalchemy.orm import Session
from schemas.dashboard import DashboardResumo

# Importando os services reais
from services import medico_service, paciente_service, grupo_service, triagem_service

async def obter_resumo(db: Session):
    medicos = await medico_service.listar_medicos(db)
    pacientes = await paciente_service.listar_pacientes(db)
    grupos = await grupo_service.listar_grupos(db)
    
    triagens = await triagem_service.listar_triagens(db)

    agora = datetime.now()
    mes_atual = agora.month
    ano_atual = agora.year

    def eh_deste_mes(data_obj):
        if not data_obj:
            return False
        if isinstance(data_obj, str):
            try:
                data_obj = datetime.fromisoformat(data_obj)
            except ValueError:
                return False
        return data_obj.month == mes_atual and data_obj.year == ano_atual

    medicos_mes = 0 # Profissional_Saude não possui data_cadastro no SQL original
    pacientes_mes = sum(1 for p in pacientes if eh_deste_mes(getattr(p, 'data_cadastro', None)))
    triagens_mes = sum(1 for t in triagens if eh_deste_mes(getattr(t, 'data_hora', None)))

    grafico = [0] * 12
    for t in triagens:
        dt = getattr(t, 'data_hora', None)
        if isinstance(dt, str):
            try:
                dt = datetime.fromisoformat(dt)
            except:
                pass
        if dt and dt.year == ano_atual:
            grafico[dt.month - 1] += 1

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