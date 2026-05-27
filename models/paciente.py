
class PacienteModel:
    def __init__(self, id: int, nome: str, cpf: str, status: str, responsavel: list[str], grupos: list[str], data_cadastro: str): # <-- Adicione o parâmetro aqui
        self.id = id
        self.nome = nome
        self.cpf = cpf
        self.status = status
        self.responsavel = responsavel
        self.grupos = grupos
        self.data_cadastro = data_cadastro