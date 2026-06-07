import asyncio

# 1. Estruturas de Dados Mocks (Listas de Dicionários)

GRUPOS_SEED = [
    {
        "id": 1,
        "nome_fantasia": "Unimed",
        "cnpj": "12345678000190",
        "cor": "#00995D",
        "criado_em": "2026-05-10T08:00:00"
    },
    {
        "id": 2,
        "nome_fantasia": "Bradesco",
        "cnpj": "98765432000110",
        "cor": "#CC092F",
        "criado_em": "2026-05-10T08:00:00"
    },
    {
        "id": 3,
        "nome_fantasia": "Amil",
        "cnpj": "45678901000123",
        "cor": "#0055A5",
        "criado_em": "2026-05-10T08:00:00"
    }
]

MEDICOS_SEED = [
    {
        "id": 1, 
        "nome": "Dr. João Silva", 
        "email": "joao.silva@hospital.com", 
        "cpf": "11122233344",
        "crm": "12345",
        "telefone": "41999999999",
        "cidade": "Curitiba",
        "uf": "PR",
        "data_nascimento": "1980-05-10",
        "senha_hash": "senha123"
    },
    {
        "id": 2, 
        "nome": "Dra. Maria Oliveira", 
        "email": "maria.oliveira@hospital.com", 
        "cpf": "55566677788",
        "crm": "67890",
        "telefone": "11988888888",
        "cidade": "São Paulo",
        "uf": "SP",
        "data_nascimento": "1985-08-20",
        "senha_hash": "senha456"
    }
]

TRIAGENS_SEED = [
    {
        "id": i, 
        "medico_id": (i % 2) + 1, 
        "paciente_id": i, 
        "resultado": "Risco Baixo", 
        "data_hora": f"2026-05-{10+(i%15):02d}T10:30:00"
    }
    for i in range(1, 13)
]


# 2. Função principal para popular o banco no futuro

async def seed_all(db_session=None):
    """
    Itera sobre as listas de sementes (seed) e adiciona ao banco de dados.
    No futuro, db_session será a sessão do SQLAlchemy (ex: AsyncSession).
    """
    print("🌱 Iniciando o povoamento do banco de dados (Seed)...")
    
    # Exemplo de como ficará seu código futuramente:
    # for grupo_data in GRUPOS_SEED:
    #     db_session.add(GrupoModel(**grupo_data))
    # 
    # for medico_data in MEDICOS_SEED:
    #     db_session.add(MedicoModel(**medico_data))
    # 
    # for triagem_data in TRIAGENS_SEED:
    #     db_session.add(TriagemModel(**triagem_data))
    #
    # await db_session.commit()
    
    print("✅ Seed concluído com sucesso!")


# (Opcional) Permite rodar o script diretamente pelo terminal para testes
if __name__ == "__main__":
    asyncio.run(seed_all())