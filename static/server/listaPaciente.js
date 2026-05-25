/* ========================================================
   listaPaciente.js
   Toda a lógica da página de Lista de Pacientes.
   ======================================================== */

// ── Dados iniciais de exemplo ──
let pacientes = [
  {
    id: 1,
    nome: "Ana Paula Souza",
    cpf: "123.456.789-00",
    idade: 34,
    convenio: "Unimed",
    ultimaConsulta: "12/05/2026",
    status: "Ativo",
  },
  {
    id: 2,
    nome: "Carlos Mendes",
    cpf: "987.654.321-00",
    idade: 52,
    convenio: "Bradesco Saúde",
    ultimaConsulta: "03/04/2026",
    status: "Ativo",
  },
  {
    id: 3,
    nome: "Fernanda Lima",
    cpf: "456.123.789-11",
    idade: 28,
    convenio: "Particular",
    ultimaConsulta: "18/03/2026",
    status: "Pendente",
  },
  {
    id: 4,
    nome: "João Roberto Alves",
    cpf: "321.654.987-22",
    idade: 67,
    convenio: "SulAmérica",
    ultimaConsulta: "22/02/2026",
    status: "Inativo",
  },
  {
    id: 5,
    nome: "Mariana Costa",
    cpf: "654.321.123-33",
    idade: 41,
    convenio: "Amil",
    ultimaConsulta: "07/05/2026",
    status: "Ativo",
  },
  {
    id: 6,
    nome: "Ricardo Ferreira",
    cpf: "789.012.345-44",
    idade: 59,
    convenio: "Unimed",
    ultimaConsulta: "29/04/2026",
    status: "Ativo",
  },
  {
    id: 7,
    nome: "Sofia Nascimento",
    cpf: "234.567.890-55",
    idade: 22,
    convenio: "Particular",
    ultimaConsulta: "15/01/2026",
    status: "Inativo",
  },
  {
    id: 8,
    nome: "Thiago Oliveira",
    cpf: "890.123.456-66",
    idade: 38,
    convenio: "Bradesco Saúde",
    ultimaConsulta: "10/05/2026",
    status: "Ativo",
  },
  {
    id: 9,
    nome: "leonardo silva",
    cpf: "890.123.456-66",
    idade: 38,
    convenio: "Bradesco Saúde",
    ultimaConsulta: "10/05/2026",
    status: "Ativo",
  },
  {
    id: 10,
    nome: "Bruna Oliveira",
    cpf: "890.123.456-66",
    idade: 44,
    convenio: "Bradesco Saúde",
    ultimaConsulta: "10/05/2026",
    status: "Ativo",
  },
  {
    id: 11,
    nome: "Pierre Craze",
    cpf: "890.123.456-66",
    idade: 44,
    convenio: "Bradesco Saúde",
    ultimaConsulta: "10/05/2026",
    status: "Ativo",
  },
];

let idCounter = 9;
let paginaAtual = 1;
const POR_PAGINA = 5;
let editandoId = null;

// ── Utilitários ──

function iniciais(nome) {
  const partes = nome.trim().split(" ");
  return partes.length >= 2
    ? (partes[0][0] + partes[1][0]).toUpperCase()
    : partes[0][0].toUpperCase();
}

function badgeStatus(status) {
  const classes = {
    Ativo: "badge-ativo",
    Inativo: "badge-inativo",
    Pendente: "badge-pendente",
  };
  return `<span class="badge ${classes[status] ?? ""}">${status}</span>`;
}

function dataHoje() {
  const d = new Date();
  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    d.getFullYear(),
  ].join("/");
}

// ── Filtro ──

function getPacientesFiltrados() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  const st = document.getElementById("filterStatus").value;

  return pacientes.filter((p) => {
    const matchQ =
      p.nome.toLowerCase().includes(q) ||
      p.cpf.includes(q) ||
      p.convenio.toLowerCase().includes(q);
    const matchSt = !st || p.status === st;
    return matchQ && matchSt;
  });
}

function filtrar() {
  paginaAtual = 1;
  renderizar();
}

// ── Renderização ──

function renderizar() {
  const filtrados = getPacientesFiltrados();
  const total = filtrados.length;
  const totalPag = Math.max(1, Math.ceil(total / POR_PAGINA));

  if (paginaAtual > totalPag) paginaAtual = totalPag;

  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = filtrados.slice(inicio, inicio + POR_PAGINA);

  const tbody = document.getElementById("tabelaBody");
  const empty = document.getElementById("emptyState");

  if (pagina.length === 0) {
    tbody.innerHTML = "";
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
    tbody.innerHTML = pagina
      .map(
        (p, i) => `
      <tr style="animation-delay:${i * 0.045}s">
        <td>
          <span class="patient-name">
            <span class="patient-initials">${iniciais(p.nome)}</span>
            ${p.nome}
          </span>
        </td>
        <td>${p.cpf}</td>
        <td>${p.idade} anos</td>
        <td>${p.convenio}</td>
        <td>${p.ultimaConsulta}</td>
        <td>${badgeStatus(p.status)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-acao" onclick="editarPaciente(${p.id})">Editar</button>
            <button class="btn-acao" onclick="excluirPaciente(${p.id})">Excluir</button>
          </div>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  // Info de paginação
  const de = total === 0 ? 0 : inicio + 1;
  const ate = Math.min(inicio + POR_PAGINA, total);
  document.getElementById("paginacaoInfo").textContent =
    `Exibindo ${de}–${ate} de ${total} paciente${total !== 1 ? "s" : ""}`;

  // Botões de paginação
  const btnsDiv = document.getElementById("paginacaoBtns");
  let btns = `<button class="pg-btn" onclick="irPara(${paginaAtual - 1})" ${paginaAtual === 1 ? "disabled" : ""}>‹</button>`;
  for (let i = 1; i <= totalPag; i++) {
    btns += `<button class="pg-btn ${i === paginaAtual ? "active" : ""}" onclick="irPara(${i})">${i}</button>`;
  }
  btns += `<button class="pg-btn" onclick="irPara(${paginaAtual + 1})" ${paginaAtual === totalPag ? "disabled" : ""}>›</button>`;
  btnsDiv.innerHTML = btns;
}

function irPara(p) {
  const total = Math.max(
    1,
    Math.ceil(getPacientesFiltrados().length / POR_PAGINA),
  );
  if (p < 1 || p > total) return;
  paginaAtual = p;
  renderizar();
}

// ── Modal ──

function abrirModal(id = null) {
  editandoId = id;
  document.getElementById("modalTitulo").textContent = id
    ? "Editar Paciente"
    : "Novo Paciente";

  if (id) {
    const p = pacientes.find((x) => x.id === id);
    document.getElementById("fNome").value = p.nome;
    document.getElementById("fCpf").value = p.cpf;
    document.getElementById("fIdade").value = p.idade;
    document.getElementById("fConvenio").value = p.convenio;
    document.getElementById("fStatus").value = p.status;
  } else {
    ["fNome", "fCpf", "fIdade", "fConvenio"].forEach((id) => {
      document.getElementById(id).value = "";
    });
    document.getElementById("fStatus").value = "Ativo";
  }

  document.getElementById("modalOverlay").classList.add("open");
}

function fecharModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  editandoId = null;
}

// ── CRUD ──

function salvarPaciente() {
  const nome = document.getElementById("fNome").value.trim();
  const cpf = document.getElementById("fCpf").value.trim();
  const idade = parseInt(document.getElementById("fIdade").value, 10);
  const convenio = document.getElementById("fConvenio").value.trim();
  const status = document.getElementById("fStatus").value;

  if (!nome || !cpf || isNaN(idade) || !convenio) {
    mostrarToast("Preencha todos os campos!");
    return;
  }

  if (editandoId) {
    const idx = pacientes.findIndex((x) => x.id === editandoId);
    pacientes[idx] = { ...pacientes[idx], nome, cpf, idade, convenio, status };
    mostrarToast("Paciente atualizado com sucesso!");
  } else {
    pacientes.unshift({
      id: idCounter++,
      nome,
      cpf,
      idade,
      convenio,
      ultimaConsulta: dataHoje(),
      status,
    });
    mostrarToast("Paciente cadastrado com sucesso!");
  }

  fecharModal();
  renderizar();
}

function editarPaciente(id) {
  abrirModal(id);
}

function excluirPaciente(id) {
  if (!confirm("Deseja excluir este paciente?")) return;
  pacientes = pacientes.filter((p) => p.id !== id);
  renderizar();
  mostrarToast("Paciente removido.");
}

// ── Máscara CPF ──

function mascaraCpf(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  input.value = v;
}

// ── Toast ──

function mostrarToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

// ── Fechar modal clicando fora ──
document.getElementById("modalOverlay").addEventListener("click", function (e) {
  if (e.target === this) fecharModal();
});

// ── Init ──
renderizar();
