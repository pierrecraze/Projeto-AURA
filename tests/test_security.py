"""Testes do módulo de segurança: hash de senha e tokens JWT."""
import datetime

import jwt
import pytest
from fastapi import HTTPException

from core import security


def test_hash_de_senha_roundtrip():
    h = security.gerar_hash_senha("minhaSenha123")
    assert h != "minhaSenha123"               # nunca guarda em texto puro
    assert security.verificar_senha("minhaSenha123", h) is True
    assert security.verificar_senha("senhaErrada", h) is False


def test_verificar_senha_com_hash_invalido_nao_explode():
    # Hash malformado deve retornar False, não levantar exceção.
    assert security.verificar_senha("x", "nao-e-um-hash-bcrypt") is False


def test_token_jwt_roundtrip():
    token = security.criar_token_jwt({"sub": "dr@x.com", "role": "medico", "id": 9})
    dados = security.obter_usuario_atual(token)
    assert dados == {"email": "dr@x.com", "id": 9, "role": "medico"}


def test_token_expirado_da_401():
    expirado = jwt.encode(
        {
            "sub": "a@a.com",
            "exp": datetime.datetime.utcnow() - datetime.timedelta(minutes=1),
        },
        security.secret_key,
        algorithm=security.algorithm,
    )
    with pytest.raises(HTTPException) as exc:
        security.obter_usuario_atual(expirado)
    assert exc.value.status_code == 401
    assert "expirado" in exc.value.detail.lower()


def test_token_invalido_da_401():
    with pytest.raises(HTTPException) as exc:
        security.obter_usuario_atual("isto.nao.e.um.token")
    assert exc.value.status_code == 401


def test_token_sem_sub_da_401():
    sem_sub = jwt.encode({"role": "admin", "id": 1}, security.secret_key, algorithm=security.algorithm)
    with pytest.raises(HTTPException) as exc:
        security.obter_usuario_atual(sem_sub)
    assert exc.value.status_code == 401
