/* ========================================================
   listaPaciente.js
   Lista de pacientes (front-end) + persistência local.
   Campos do cadastro: nome, nascimento, sexo, mãe/pai,
   responsável, parentesco, CPF do responsável, cidade/estado/país.
   ======================================================== */

const API_URL = "/api/pacientes/";
const POR_PAGINA = 8;

let paginaAtual = 1;
let pacientes = [];

// ─────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────

async function loadPacientes() {
  try {
    const token = localStorage.getItem('aura_token');
    const res = await fetch(API_URL, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.filter(p => !p.deletado_em);
    }
  } catch (err) {
    console.error("Erro ao carregar pacientes da API:", err);
  }
  return [];
}

// ─────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────

// iniciais() e dataBR() vêm do home.js (carregado antes deste script).

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
      <tr class="row-click" style="animation-delay:${i * 0.045}s" onclick="verPaciente('${p.id}')">
        <td>
          <span class="patient-name">
            <span class="patient-initials">${iniciais(p.nome)}</span>
            ${p.nome ?? ""}
          </span>
        </td>
        <td>${dataBR(p.dataNascimento || p.data_nascimento)}</td>
        <td>${p.sexoBiologico || p.sexo_biologico || "-"}</td>
        <td>${p.responsavel ?? "-"}</td>
        <td>${[p.cidade, p.estado].filter(Boolean).join(" / ") || "-"}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-acao" onclick="event.stopPropagation(); editarPaciente('${p.id}')">Editar</button>
            <button class="btn-acao" onclick="event.stopPropagation(); excluirPaciente('${p.id}')">Excluir</button>
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

function verPaciente(id) {
  const ret = encodeURIComponent(getReturnPage());
  window.location.href = `paciente.html?id=${encodeURIComponent(id)}&return=${ret}`;
}

function editarPaciente(id) {
  const ret = encodeURIComponent(getReturnPage());
  window.location.href = `cadastroPaciente.html?id=${encodeURIComponent(id)}&return=${ret}`;
}

async function excluirPaciente(id) {
  if (!confirm("Deseja excluir este paciente?")) return;
  
  try {
    const token = localStorage.getItem('aura_token');
    const res = await fetch(`${API_URL}${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      pacientes = pacientes.filter((p) => p.id !== id);
      renderizar();
    } else {
      alert("Erro ao excluir o paciente.");
    }
  } catch (err) {
    console.error("Erro ao deletar:", err);
  }
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────

(async function init() {
  // Se não houver nada salvo ainda, mantém lista vazia.
  // (Sem seed para não confundir com dados reais.)

  const searchEl = document.getElementById("searchInput");
  if (searchEl) {
    // caso a página não use inline oninput
    searchEl.addEventListener("input", () => filtrar());
  }

  pacientes = await loadPacientes();
  renderizar();
})();
