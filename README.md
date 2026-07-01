## 📄 Descrição do projeto:

<p>O sistema detém como proposta funcionar como uma ferramenta de triagem para auxiliar o Instituto Buko Kaesemodel (IBK) na identificação precoce de pessoas com suspeita da "Síndrome do X Frágil", a partir de um checklist estruturado que se baseia em sinais cognitivos, físicos e comportamentais do indivíduo.</p> 
<p>Idealmente, a interface será bem objetiva, que conterá apenas as informações, dados e páginas que o usuário realmente precisar. Dessa forma, garante-se um sistema leve, rápido e profissional para quem for usufruir.</p>

> Autores: João Pedro M. Correa, Matheus Antunes, Patrick Davidson, Pedro Magno e Pierre Craze.
> <br>
> Título: Ambiente Unificado de Rastreio e Avaliação (AURA).
> <br>
> Disciplina: Experiência Criativa | 3° Período.

<br>

## 🌐 Acesso ao Sistema (Produção):

O sistema AURA está hospedado na nuvem via **Vercel** e o banco de dados no **Supabase**. O sistema está disponível 24/7 de forma automática (Serverless). Não é necessário configurar nada localmente para utilizar a versão final.
👉 **Acesse aqui:** https://projeto-aura.vercel.app

## Tutoriais:

Tutorial de uso: https://youtu.be/R0Ud4DwH8OA

Tutorial de "instalação": https://youtu.be/_51cRwNbKxQ

<br>

## 📼 Tecnologias implementadas:
### FrontEnd:
- HTML
- CSS
- JavaScript

### BackEnd e Banco de Dados:
- Python
- PostgreSQL

<br>

## 🗂️ Estrutura das pastas e arquivos do repositório:
```text
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
│   │   ├── dashboard.css
│   │   ├── formulario.css
│   │   ├── home.css
│   │   ├── listaPaciente.css
│   │   ├── login.css
│   │   └── styles.css
│   ├── server/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── formulario.js
│   │   ├── home.js
│   │   ├── listaPaciente.js
│   │   └── login.js
│   ├── dashboard.html
│   ├── dashboardMedico.html
│   ├── favicon.ico
│   ├── formulario.html
│   ├── index.html
│   ├── listaPaciente.html
│   └── login.html
├── .env
├── README.md
├── main.py
└── requirements.txt
