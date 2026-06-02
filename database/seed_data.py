import asyncio

# 1. Estruturas de Dados Mocks (Listas de Dicionários)

GRUPOS_SEED = [
    {
        "id": 1,
        "nome": "Unimed",
        "cnpj": "12.345.678/0001-90",
        "status": "Ativo",
        "cor": "#00995D",
        "logo": "url_logo_unimed.jpg"
    },
    {
        "id": 2,
        "nome": "Bradesco",
        "cnpj": "98.765.432/0001-10",
        "status": "Ativo",
        "cor": "#CC092F",
        "logo": "url_logo_bradesco.jpg"
    },
    {
        "id": 3,
        "nome": "Amil",
        "cnpj": "45.678.901/0001-23",
        "status": "Ativo",
        "cor": "#0055A5",
        "logo": "url_logo_amil.jpg"
    }
]

MEDICOS_SEED = [
    {
        "id": 1, 
        "nome": "Dr. João Silva", 
        "crm": "12345", 
        "email": "joao.silva@hospital.com", 
        "status": "Ativo", 
        "senha": "senha123", 
        "grupos": ["Unimed"], 
        "data_cadastro": "2026-05-10T08:00:00"
    },
    {
        "id": 2, 
        "nome": "Dra. Maria Oliveira", 
        "crm": "67890", 
        "email": "maria.oliveira@hospital.com", 
        "status": "Ativo", 
        "senha": "senha456", 
        "grupos": ["Bradesco", "Amil"], 
        "data_cadastro": "2026-05-12T14:30:00"
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