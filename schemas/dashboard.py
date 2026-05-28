from pydantic import BaseModel

class DashboardResumo(BaseModel):
    total_medicos: int
    medicos_mes: int
    total_pacientes: int
    pacientes_mes: int
    total_grupos: int
    total_triagens: int
    triagens_mes: int
    grafico_triagens: list[int]