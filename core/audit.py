import functools
from schemas.log import LogCreate
from services import log_service
from models.admin import AdminModel
from models.medico import MedicoModel


def obter_ip_cliente(request) -> str | None:
    """Extrai o IP real do cliente. Atrás de proxy (ex.: Vercel) o IP verdadeiro
    vem no cabeçalho X-Forwarded-For; senão usamos o IP da conexão direta."""
    if request is None:
        return None
    encaminhado = request.headers.get("x-forwarded-for")
    if encaminhado:
        return encaminhado.split(",")[0].strip()
    return request.client.host if request.client else None


def registrar_auditoria(entidade: str, acao: str):
    """
    Decorador assíncrono para registrar logs de auditoria automaticamente.
    Espera que a função decorada retorne um objeto com os atributos 'id' e 'nome'.
    """

    
    def decorator(func): #Decorator é um padrão de programação onde você adiciona um comportamento a uma função existente sem precisar modificar o código original dela.
        @functools.wraps(func)
        # A função wrapper é a função que realmente envolve a função original (func) e adiciona a funcionalidade de auditoria.
        async def wrapper(*args, **kwargs): # *args e **kwargs são usados para passar um número variável de argumentos para a função decorada, permitindo flexibilidade na assinatura da função.
            # Pega o autor da ação, que agora será passado como um argumento nomeado 'ator'
            ator = kwargs.get('ator')
            # O IP é só para a auditoria — removemos dos kwargs para não vazar para a
            # função de serviço (que não conhece esse parâmetro).
            ip_origem = kwargs.pop('ip', None)

            # 1. Executa a função do serviço (CRUD)
            resultado = await func(*args, **kwargs)
            
            # 2. Verifica se a operação foi bem-sucedida e gerou um resultado
            if resultado is not None:
                # getattr ou Get Attribute é uma função embutida do Python que tenta obter um atributo de um objeto. 
                # Se o atributo não existir, ele retorna um valor padrão (neste caso, 'Desconecido' para o ID e uma string vazia para o nome).
                item_id = getattr(resultado, 'id', 'Desconhecido')
                item_nome = getattr(resultado, 'nome_fantasia', getattr(resultado, 'nome', ''))
                
                # Formata o nome na frase caso ele exista
                nome_formatado = f" {item_nome}" if item_nome else ""
                detalhes = f"Operação de '{acao}' executada com sucesso. Entidade: {entidade}{nome_formatado} (ID: {item_id})."
                
                ator_id = 1
                tipo_ator = "sistema"
                if ator:
                    ator_id = ator.id
                    if isinstance(ator, AdminModel):
                        tipo_ator = "admin_sistema"
                    elif isinstance(ator, MedicoModel):
                        tipo_ator = "medico"

                novo_log = LogCreate(
                    tabela_afetada=entidade,
                    acao_realizada=acao,
                    detalhe=detalhes.strip(),
                    tipo_ator=tipo_ator,
                    ator_id=ator_id,
                    ip_origem=ip_origem
                )
                await log_service.criar_log(novo_log)
                
            return resultado
        return wrapper
    return decorator