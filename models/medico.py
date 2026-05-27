
class MedicoModel:
    def __init__(self, id: int, nome: str, crm: str, email: str, status: str, senha: str, grupos: list[str], data_cadastro: str):
        self.id = id
        self.nome = nome
        self.crm = crm
        self.email = email
        self.status = status
        self.senha = senha
        self.grupos = grupos
        self.data_cadastro = data_cadastro