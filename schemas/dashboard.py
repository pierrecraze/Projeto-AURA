from pydantic import BaseModel

class DashboardResumo(BaseModel):
    total_medicos: int
    total_pacientes: int
    total_grupos: int
    total_logs: int