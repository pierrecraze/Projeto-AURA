
class PacienteModel:
    def __init__(self, id: int, nome: str, cpf: str, status: str, responsavel: list[str], grupos: list[str]):
        self.id = id
        self.nome = nome
        self.cpf = cpf
        self.status = status
        self.responsavel = responsavel
        self.grupos = grupos