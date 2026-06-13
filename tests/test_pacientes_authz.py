"""Testes de autorização por instituição (regressão do IDOR de pacientes).

Usa uma sessão de banco falsa para não depender do Postgres real.
"""
import types

import pytest
from fastapi import HTTPException

from routes.pacientes import carregar_paciente_autorizado
from models.paciente import PacienteModel
from models.medico import MedicoModel


class _FakeQuery:
    def __init__(self, resultado):
        self._resultado = resultado

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._resultado


class _FakeDB:
    """Devolve um objeto pré-configurado conforme o modelo consultado."""
    def __init__(self, por_modelo):
        self._por_modelo = por_modelo

    def query(self, modelo):
        return _FakeQuery(self._por_modelo.get(modelo))


def _paciente(inst):
    return types.SimpleNamespace(id="p1", instituicao_id=inst)


def _medico(inst):
    return types.SimpleNamespace(email="dr@x.com", instituicao_id=inst)


def test_admin_acessa_qualquer_paciente():
    db = _FakeDB({PacienteModel: _paciente(inst=1)})
    p = carregar_paciente_autorizado(db, "p1", {"role": "admin", "email": "a@a.com"})
    assert p.instituicao_id == 1


def test_medico_acessa_paciente_da_propria_instituicao():
    db = _FakeDB({PacienteModel: _paciente(inst=5), MedicoModel: _medico(inst=5)})
    p = carregar_paciente_autorizado(db, "p1", {"role": "medico", "email": "dr@x.com"})
    assert p.instituicao_id == 5


def test_medico_nao_acessa_paciente_de_outra_instituicao():
    db = _FakeDB({PacienteModel: _paciente(inst=1), MedicoModel: _medico(inst=2)})
    with pytest.raises(HTTPException) as exc:
        carregar_paciente_autorizado(db, "p1", {"role": "medico", "email": "dr@x.com"})
    assert exc.value.status_code == 404  # 404 (e não 403) para não revelar existência


def test_paciente_inexistente_da_404():
    db = _FakeDB({PacienteModel: None})
    with pytest.raises(HTTPException) as exc:
        carregar_paciente_autorizado(db, "p1", {"role": "admin", "email": "a@a.com"})
    assert exc.value.status_code == 404


def test_usuario_sem_medico_correspondente_da_404():
    db = _FakeDB({PacienteModel: _paciente(inst=1), MedicoModel: None})
    with pytest.raises(HTTPException) as exc:
        carregar_paciente_autorizado(db, "p1", {"role": "medico", "email": "fantasma@x.com"})
    assert exc.value.status_code == 404
