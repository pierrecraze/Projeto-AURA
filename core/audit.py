import functools
from schemas.log import LogCreate
from services import log_service

def registrar_auditoria(entidade: str, acao: str):
    """
    Decorador assíncrono para registrar logs de auditoria automaticamente.
    Espera que a função decorada retorne um objeto com os atributos 'id' e 'nome'.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # 1. Executa a função do serviço (CRUD)
            resultado = await func(*args, **kwargs)
            
            # 2. Verifica se a operação foi bem-sucedida e gerou um resultado
            if resultado is not None:
                item_id = getattr(resultado, 'id', 'Desconhecido')
                item_nome = getattr(resultado, 'nome', '')
                
                # Formata o nome na frase caso ele exista
                nome_formatado = f" {item_nome}" if item_nome else ""
                detalhes = f"Operação de '{acao}' executada com sucesso. Entidade: {entidade}{nome_formatado} (ID: {item_id})."
                
                novo_log = LogCreate(
                    entidade=entidade,
                    acao=acao,
                    detalhes=detalhes.strip()
                )
                await log_service.criar_log_mock(novo_log)
                
            return resultado
        return wrapper
    return decorator