## 📄 Descrição do projeto:

<p>O sistema detêm como proposta, funcionar como uma ferramenta de triagem para auxiliar o Instituto Buko Kaesemodel (IBK) na identifição prematura de pessoas que possuem suspeita de possuir a "Síndrome do X Frágil". a partir de um checklist estruturado que se baseia em sinais cognitivos, físicos e comportamentais do indivíduo.</p> 
<p>Idealmente, a interface será bem objetiva, onde irá conter apenas as informações, dados e páginas que o usuário realmente precisar, dessa forma, garante um sistema leve, rápido e profissional para quem for usufruir</p>

> Autores: João Pedro M. Correa, Matheus Antunes, Patrick Davidson, Pedro Magno e Pierre Craze.
> <br>
> Título: Ambiente Unificado de Rastreio e Avaliação (AURA).
> <br>
> Disciplina: Experiência Criativa | 3° Período.

<br>

## 📼 Tecnologias implementadas:
### FrontEnd:
- HTML
- CSS
- JavaScript

### BackEnd e Banco de Dados:
- Python
- PostGres

<br>

## 🗂️ Estrutura das pastas e arquivos do repositório:
``` text
Projeto-AURA/
├── database/
│   └── db.py
├── models/
│   └── item.py
├── routes/
│   └── item.py
├── services/
│   └── item_service.py
├── static/                
│   ├── css/
│   │   └── dashboard.css
│   │   └── formulario.css
│   │   └── home.css
│   │   └── listaPaciente.css
│   │   └── login.css
│   │   └── styles.css
│   └── server/
│       ├── api.js
│       └── app.js
│       └── formulario.js
│       └── home.js
│       └── listaPaciente.js
│       └── login.js
│   ├── dashboard.html
│   ├── dashboardMedico.html
│   ├── favicon.ico
│   ├── formulario.html
│   ├── index.html
│   ├── listaPaciente.html
│   ├── login.html
├── .env
├── README.md
├── main.py
└── requirements.txt
```

<!-- VERSÃO ANTERIOR:
Projeto-AURA/
├── main.py
├── routes/
│   └── items.py
├── services/
│   └── item_service.py
├── models/
│   └── item.py
├── database/
│   └── db.py
├── static/                
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       └── api.js
├── .env
└── requirements.txt
-->


# ⚙️ Guia de Configuração e Execução — Backend Projeto AURA

> Guia passo a passo para configurar o ambiente e rodar as APIs do Projeto AURA **(Médicos, Pacientes, Grupos e Logs)** localmente na sua máquina.

---

## 📋 Sumário

1. [Pré-requisitos — Instalando o Python 3.12](#1-pré-requisitos--instalando-o-python-312)
2. [Criando o Ambiente Virtual](#2-criando-o-ambiente-virtual)
3. [Resolvendo Permissões de Execução (Windows)](#3-resolvendo-permissões-de-execução-apenas-para-windows)
4. [Ativando o Ambiente Virtual](#4-ativando-o-ambiente-virtual)
5. [Instalando as Dependências](#5-instalando-as-dependências)
6. [Executando o Servidor](#6-executando-o-servidor)
7. [Acessando e Testando as APIs](#7-acessando-e-testando-as-apis)

---

## 1. Pré-requisitos — Instalando o Python 3.12

O projeto foi desenvolvido com **Python 3.12**. Siga as instruções do seu sistema operacional:

| Sistema | Instruções |
|---|---|
| 🪟 **Windows** | Abra a **Microsoft Store**, pesquise por `Python 3.12` e clique em **Instalar**. Alternativamente, baixe pelo [site oficial](https://www.python.org/downloads/). |
| 🍎 **macOS** | Baixe pelo [site oficial](https://www.python.org/downloads/) ou, se usar o Homebrew (recomendado), rode no terminal: `brew install python@3.12` |

---

## 2. Criando o Ambiente Virtual

Abra a **pasta raiz do projeto** no seu editor (ex.: VS Code) e abra o terminal integrado. Rode o comando correspondente ao seu sistema para criar o ambiente virtual `venv` com o Python 3.12:

**🪟 Windows:**
```bash
py -3.12 -m venv venv
```

**🍎 Mac / 🐧 Linux:**
```bash
python3.12 -m venv venv
```

---

## 3. Resolvendo Permissões de Execução (apenas para Windows)

Por padrão de segurança, o **PowerShell** bloqueia a execução de scripts de ambientes virtuais. Para resolver isso de forma rápida e segura — **sem precisar de permissão de administrador** — rode o comando abaixo **uma única vez**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

> Se o terminal pedir confirmação, digite `S` e pressione **Enter**.

---

## 4. Ativando o Ambiente Virtual

Com o ambiente criado, é preciso "entrar" nele para que as instalações fiquem isoladas do restante do sistema.

**🪟 Windows:**
```bash
.\venv\Scripts\activate
```

**🍎 Mac / 🐧 Linux:**
```bash
source venv/bin/activate
```

> ✅ **Confirmação:** o ambiente está ativo quando aparecer `(venv)` no início da linha do terminal.

---

## 5. Instalando as Dependências

Com o ambiente ativado, instale as bibliotecas necessárias — **FastAPI**, **Uvicorn** e **Pydantic**:

```bash
pip install fastapi "uvicorn[standard]" pydantic
```

> 💡 Caso o projeto venha a ter um arquivo `requirements.txt` no futuro, basta rodar `pip install -r requirements.txt`.

---

## 6. Executando o Servidor

Tudo pronto! Rode o comando abaixo para iniciar a API em **modo de desenvolvimento** (o servidor reinicia automaticamente a cada alteração salva no código):

```bash
uvicorn main:app --reload
```

---

## 7. Acessando e Testando as APIs

O FastAPI gera a **documentação interativa** automaticamente. Abra o navegador e acesse o **Swagger UI** para testar as rotas de Médicos, Pacientes, Grupos e Logs:

> 👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**
