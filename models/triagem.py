
class TriagemModel:
    def __init__(self, id: int, medico_id: int, paciente_id: int, resultado: str, data_hora: str):
        self.id = id
        self.medico_id = medico_id
        self.paciente_id = paciente_id
        self.resultado = resultado
        self.data_hora = data_hora