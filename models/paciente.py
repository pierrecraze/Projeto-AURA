

class PacienteModel:
    def __init__(self, id: int, nome: str, cpf: str, status: str):
        self.id = id
        self.nome = nome
        self.cpf = cpf
        self.status = status