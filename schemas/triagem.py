from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

# Metadados seguros que o Admin e o Dashboard podem ver (LGPD)
# Omite dados sensíveis como o Score Total e se houve Encaminhamento.
class TriagemMetadata(BaseModel):
    id: UUID
    data_hora: datetime
    paciente_id: UUID
    medico_id: int  # Adaptamos 'profissional_id' para 'medico_id' para compatibilidade com o front-end

    model_config = ConfigDict(from_attributes=True)

class TriagemCreate(BaseModel):
    # Campos que o médico preenche
    paciente_id: UUID
    score_total: int = Field(..., ge=0, le=100)  # ge=0 le=100 = entre 0 e 100
    recomendacao_encaminhamento: bool

    model_config = ConfigDict(from_attributes=True)