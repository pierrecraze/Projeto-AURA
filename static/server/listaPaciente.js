/* ========================================================
   listaPaciente.js
   Lista de pacientes (front-end) + persistência local.
   Campos do cadastro: nome, nascimento, sexo, mãe/pai,
   responsável, parentesco, CPF do responsável, cidade/estado/país.
   ======================================================== */

const STORAGE_KEY = "aura_pacientes_v1";
const POR_PAGINA = 8;

let paginaAtual = 1;
let pacientes = loadPacientes();

// ─────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────

function loadPacientes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePacientes(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ─────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────

function iniciais(nome) {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "??";
  return partes.length >= 2
    ? (partes[0][0] + partes[1][0]).toUpperCase()
    : partes[0][0].toUpperCase();
}

function isoToBR(iso) {
  if (!iso) return "-";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function getReturnPage() {
  const file = window.location.pathname.split("/").pop();
  return file || "todosPacientes.html";
}

// ─────────────────────────────────────────────
// Filtro
// ─────────────────────────────────────────────

function getPacientesFiltrados() {
  const searchEl = document.getElementById("searchInput");
  const q = (searchEl?.value || "").toLowerCase().trim();

  if (!q) return pacientes;

  return pacientes.filter((p) => {
    const hay = [
      p.nome,
      p.responsavel,
      p.cidade,
      p.estado,
      p.pais,
      p.nomeMae,
      p.nomePai,
      p.grauParentesco,
      p.sexoBiologico,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const cpfResp = String(p.cpfResponsavel || "");
    return hay.includes(q) || cpfResp.includes(q);
  });
}

function filtrar() {
  paginaAtual = 1;
  renderizar();
}

// ─────────────────────────────────────────────
// Renderização
// ─────────────────────────────────────────────

function renderizar() {
  const filtrados = getPacientesFiltrados();
  const total = filtrados.length;
  const totalPag = Math.max(1, Math.ceil(total / POR_PAGINA));

  if (paginaAtual > totalPag) paginaAtual = totalPag;

  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = filtrados.slice(inicio, inicio + POR_PAGINA);

  const tbody = document.getElementById("tabelaBody");
  const empty = document.getElementById("emptyState");

  if (!tbody) return;

  if (pagina.length === 0) {
    tbody.innerHTML = "";
    if (empty) empty.style.display = "block";
  } else {
    if (empty) empty.style.display = "none";

    tbody.innerHTML = pagina
      .map(
        (p, i) => `
      <tr style="animation-delay:${i * 0.045}s">
        <td>
          <span class="patient-name">
            <span class="patient-initials">${iniciais(p.nome)}</span>
            ${p.nome ?? ""}
          </span>
        </td>
        <td>${isoToBR(p.dataNascimento)}</td>
        <td>${p.sexoBiologico ?? "-"}</td>
        <td>${p.responsavel ?? "-"}</td>
        <td>${[p.cidade, p.estado].filter(Boolean).join(" / ") || "-"}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-acao" onclick="editarPaciente('${p.id}')">Editar</button>
            <button class="btn-acao" onclick="excluirPaciente('${p.id}')">Excluir</button>
          </div>
        </td>
      </tr>`,
      )
      .join("");
  }

  renderPaginacao(total, totalPag);
}

function renderPaginacao(total, totalPag) {
  const info = document.getElementById("paginacaoInfo");
  const btnsDiv = document.getElementById("paginacaoBtns");
  if (!info || !btnsDiv) return;

  const inicio = total === 0 ? 0 : (paginaAtual - 1) * POR_PAGINA + 1;
  const fim = Math.min(paginaAtual * POR_PAGINA, total);

  info.textContent = `Exibindo ${inicio}-${fim} de ${total}`;

  let btns = "";
  btns += `<button class="pg-btn" onclick="irPara(${paginaAtual - 1})" ${paginaAtual === 1 ? "disabled" : ""}>‹</button>`;

  const start = Math.max(1, paginaAtual - 2);
  const end = Math.min(totalPag, paginaAtual + 2);
  for (let p = start; p <= end; p++) {
    btns += `<button class="pg-btn ${p === paginaAtual ? "active" : ""}" onclick="irPara(${p})">${p}</button>`;
  }

  btns += `<button class="pg-btn" onclick="irPara(${paginaAtual + 1})" ${paginaAtual === totalPag ? "disabled" : ""}>›</button>`;
  btnsDiv.innerHTML = btns;
}

function irPara(p) {
  const total = Math.max(1, Math.ceil(getPacientesFiltrados().length / POR_PAGINA));
  if (p < 1 || p > total) return;
  paginaAtual = p;
  renderizar();
}

// ─────────────────────────────────────────────
// Ações
// ─────────────────────────────────────────────

function novoPaciente() {
  const ret = encodeURIComponent(getReturnPage());
  window.location.href = `cadastroPaciente.html?return=${ret}`;
}

function editarPaciente(id) {
  const ret = encodeURIComponent(getReturnPage());
  window.location.href = `cadastroPaciente.html?id=${encodeURIComponent(id)}&return=${ret}`;
}

function excluirPaciente(id) {
  if (!confirm("Deseja excluir este paciente?")) return;
  pacientes = pacientes.filter((p) => p.id !== id);
  savePacientes(pacientes);
  renderizar();
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────

(function init() {
  // Se não houver nada salvo ainda, mantém lista vazia.
  // (Sem seed para não confundir com dados reais.)

  const searchEl = document.getElementById("searchInput");
  if (searchEl) {
    // caso a página não use inline oninput
    searchEl.addEventListener("input", () => filtrar());
  }

  renderizar();
})();
