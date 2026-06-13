"""Testes da auditoria: extração de IP e threading de IP/ator pelo decorator."""
import asyncio
import types

from core import audit
from models.medico import MedicoModel
from models.admin import AdminModel


# ---- obter_ip_cliente -------------------------------------------------------

def _req(headers=None, client_host=None):
    client = types.SimpleNamespace(host=client_host) if client_host else None
    return types.SimpleNamespace(headers=headers or {}, client=client)


def test_ip_prioriza_x_forwarded_for():
    req = _req(headers={"x-forwarded-for": "203.0.113.5, 10.0.0.1"}, client_host="10.0.0.1")
    assert audit.obter_ip_cliente(req) == "203.0.113.5"


def test_ip_usa_conexao_direta_sem_proxy():
    assert audit.obter_ip_cliente(_req(client_host="198.51.100.7")) == "198.51.100.7"


def test_ip_none_quando_sem_request():
    assert audit.obter_ip_cliente(None) is None


# ---- decorator registrar_auditoria -----------------------------------------

def _rodar_decorado(monkeypatch, ator, ip):
    """Executa uma operação decorada capturando o log gerado (sem tocar no banco)."""
    capturados = []

    async def fake_criar_log(log_in):
        capturados.append(log_in)

    monkeypatch.setattr(audit.log_service, "criar_log", fake_criar_log)

    @audit.registrar_auditoria(entidade="Paciente", acao="Criação")
    async def operacao(db, *, ator=None):
        # Se o 'ip' não tivesse sido removido (pop) dos kwargs, esta função — que
        # não declara 'ip' — explodiria com TypeError. Rodar limpo prova o pop.
        return types.SimpleNamespace(id=42, nome="Fulano")

    asyncio.run(operacao("db_fake", ator=ator, ip=ip))
    return capturados


def test_decorator_grava_ip_e_ator_medico(monkeypatch):
    logs = _rodar_decorado(monkeypatch, MedicoModel(id=7), "2.2.2.2")
    assert len(logs) == 1
    assert logs[0].ip_origem == "2.2.2.2"
    assert logs[0].tipo_ator == "medico"
    assert logs[0].ator_id == 7


def test_decorator_detecta_ator_admin(monkeypatch):
    logs = _rodar_decorado(monkeypatch, AdminModel(id=3), "9.9.9.9")
    assert logs[0].tipo_ator == "admin_sistema"
    assert logs[0].ator_id == 3
