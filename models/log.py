
class LogModel:
    def __init__(self, id: int, data_hora: str, acao: str, entidade: str, detalhes: str):
        self.id = id
        self.data_hora = data_hora
        self.acao = acao
        self.entidade = entidade
        self.detalhes = detalhes
        