from pydantic import BaseModel, ConfigDict
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


# Dados enviados pelo front-end ao concluir uma avaliação no formulário clínico
class TriagemCreate(BaseModel):
    paciente_id: UUID
    score_total: int
    recomendacao_encaminhamento: bool