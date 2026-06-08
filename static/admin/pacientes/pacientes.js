// =============================================
//  AURA — Gestão de Pacientes
// =============================================

const API_URL = "http://localhost:8000/api";
const POR_PAGINA = 10;

// ---------- DADOS MOCK ----------
const CONVENIO_COLORS = {
  "Unimed":         { bg: "#EFF6FF", color: "#1D4ED8" },
  "Bradesco Saúde": { bg: "#F5F3FF", color: "#6D28D9" },
  "SulAmérica":     { bg: "#E0F2FE", color: "#0369A1" },
  "Particular":     { bg: "#ECFDF5", color: "#047857" },
  "Outros":         { bg: "#F1F5F9", color: "#64748B" },
};

const AVATAR_COLORS = [
  { bg: "#DBEAFE", txt: "#1D4ED8" },
  { bg: "#F5F3FF", txt: "#6D28D9" },
  { bg: "#ECFDF5", txt: "#047857" },
  { bg: "#FEF9EC", txt: "#B45309" },
  { bg: "#FEF2F2", txt: "#DC2626" },
  { bg: "#E0F2FE", txt: "#0369A1" },
];

function avatarColor(i) { return AVATAR_COLORS[i % AVATAR_COLORS.length]; }

let pacientes = [];
let medicos = [];
let grupos = [];

const notificacoes = [
  { id: 1, tipo: "alert", icon: "alert-triangle", bg: "#FEF9EC", cor: "#D97706", texto: "Backup automático com atenção — verificar logs", time: "Há 30 min", lida: false },
  { id: 2, tipo: "info",  icon: "user-plus",      bg: "#EFF6FF", cor: "#1D4ED8", texto: "22 novos pacientes registrados este mês",          time: "Há 2h",    lida: false },
  { id: 3, tipo: "success",icon:"check-circle",   bg: "#ECFDF5", cor: "#059669", texto: "Log de auditoria sincronizado com sucesso",        time: "Há 3h",    lida: false },
  { id: 4, tipo: "alert", icon: "shield-alert",   bg: "#FEF2F2", cor: "#DC2626", texto: "Tentativa de acesso bloqueada — IP 192.168.4.22",  time: "Há 5h",    lida: true  },
  { id: 5, tipo: "info",  icon: "building-2",     bg: "#EFF6FF", cor: "#1D4ED8", texto: "Grupo SulAmérica Premium configurado",             time: "Ontem",    lida: true  },
];

// ---------- ESTADO ----------
let estadoFiltro = { busca: "", status: "", convenio: "" };
let paginaAtual = 1;
let viewAtual = "table";
let pacientesFiltrados = [];
let editPacienteId = null;

// ---------- CARGA DA API ----------
async function carregarDados() {
  try {
    const token = localStorage.getItem('aura_token');
    const opts = { headers: { 'Authorization': `Bearer ${token}` } };
    
    const [resPac, resMed, resGrupos] = await Promise.all([
      fetch(`${API_URL}/pacientes/`, opts),
      fetch(`${API_URL}/medicos/`, opts),
      fetch(`${API_URL}/grupos/`, opts)
    ]);

    if (resPac.status === 401) {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_user');
      window.location.replace('/static/login.html');
      return;
    }

    const dbPac = await resPac.json();
    medicos = resMed.ok ? await resMed.json() : [];
    grupos = resGrupos.ok ? await resGrupos.json() : [];

    pacientes = dbPac.map(p => {
      const medico = medicos.find(m => m.id === p.cadastrado_por_id);
      const inst = grupos.find(g => g.id === p.instituicao_id);
      
      let cpfMascara = p.cpf || "Não informado";
      if (p.cpf && p.cpf.length === 11) {
        cpfMascara = p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      }

      return {
        id: p.id,
        instituicao_id: p.instituicao_id,
        cadastrado_por_id: p.cadastrado_por_id,
        idCurto: p.id.split('-')[0].toUpperCase(),
        nome: p.nome,
        cpf: cpfMascara,
        nasc: p.data_nascimento ? p.data_nascimento.split('-').reverse().join('/') : "Não informado",
        sexo: p.sexo_biologico === 'M' ? "Masculino" : (p.sexo_biologico === 'F' ? "Feminino" : "Outro"),
        tel: "—",
        email: "—",
        end: "—",
        status: p.deletado_em ? "Inativo" : "Ativo",
        cadastro: p.data_cadastro ? new Date(p.data_cadastro).toLocaleDateString('pt-BR') : "—",
        medicos: medico ? [{ nome: medico.nome, esp: "Cadastrador" }] : [],
        convenios: inst ? [inst.nome_fantasia] : [],
      };
    });

    atualizarKPIsPacientes();
    aplicarFiltros();
    popularSelectsModal();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

function popularSelectsModal() {
  const selConv = document.getElementById("novoPacConvenio");
  const selMed = document.getElementById("novoPacMedico");
  
  if (selConv) {
      selConv.innerHTML = '<option value="">Selecione um convênio</option>' + 
                          grupos.map(g => `<option value="${g.id}">${g.nome_fantasia}</option>`).join('');
  }
  if (selMed) {
      selMed.innerHTML = '<option value="">Selecione um médico</option>' + 
                         medicos.map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
  }
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  setupDate();
  setupSidebar();
  setupProfile();
  setupNotificacoes();
  setupFiltros();
  setupViewToggle();
  setupModal();
  setupModalNovo();
  setupPaginacao();
  setupMascarasNovoPaciente();
  carregarDados();
  lucide.createIcons();
});

// ---------- DATA ----------
function setupDate() {
  const el = document.getElementById("current-date");
  if (el) el.textContent = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// ---------- SIDEBAR ----------
function setupSidebar() {
  const sidebar = document.getElementById("sidebar");
  const btn = document.getElementById("sidebarToggle");
  const icon = document.getElementById("toggleIcon");
  if (!btn) return;
  let collapsed = false;
  btn.addEventListener("click", () => {
    collapsed = !collapsed;
    sidebar.classList.toggle("collapsed", collapsed);
    icon.setAttribute("data-lucide", collapsed ? "panel-left-open" : "menu");
    lucide.createIcons();
  });
}

// ---------- PERFIL ----------
function setupProfile() {
  const user = JSON.parse(localStorage.getItem("aura_user") || "{}");
  const nome = user.nome || "Admin Principal";
  const iniciais = nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "AD";
  ["profileName", "topbarName"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = nome; });
  ["profileAvatar", "topbarAvatar"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = iniciais; });
  const btnLogout = document.querySelector(".logout");
  if (btnLogout) btnLogout.addEventListener("click", () => {
    localStorage.removeItem("aura_token");
    localStorage.removeItem("aura_user");
    window.location.replace("/static/login.html");
  });
}

// ---------- NOTIFICAÇÕES ----------
function setupNotificacoes() {
  const btn = document.getElementById("notifBtn");
  const panel = document.getElementById("notifPanel");
  const backdrop = document.getElementById("notifBackdrop");
  const markAll = document.getElementById("markAllRead");
  const dot = document.getElementById("notifDot");
  const list = document.getElementById("notifList");

  function temNaoLidas() { return notificacoes.some(n => !n.lida); }

  function renderDot() {
    if (dot) dot.style.display = temNaoLidas() ? "block" : "none";
  }

  function renderNotificacoes() {
    list.innerHTML = "";
    notificacoes.forEach(n => {
      const item = document.createElement("div");
      item.className = "notif-item" + (n.lida ? "" : " unread");
      item.innerHTML = `
        <div class="notif-item-icon" style="background:${n.bg}">
          <i data-lucide="${n.icon}" style="color:${n.cor}"></i>
        </div>
        <div class="notif-item-body">
          <p class="notif-item-text">${n.texto}</p>
          <p class="notif-item-time">${n.time}</p>
        </div>
        ${!n.lida ? '<span class="notif-unread-dot"></span>' : ''}
      `;
      item.addEventListener("click", () => {
        n.lida = true;
        renderNotificacoes();
        renderDot();
        lucide.createIcons();
      });
      list.appendChild(item);
    });
    lucide.createIcons();
  }

  renderDot();
  renderNotificacoes();

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.contains("open");
    panel.classList.toggle("open", !isOpen);
    backdrop.classList.toggle("open", !isOpen);
  });

  backdrop.addEventListener("click", () => {
    panel.classList.remove("open");
    backdrop.classList.remove("open");
  });

  markAll.addEventListener("click", () => {
    notificacoes.forEach(n => n.lida = true);
    renderNotificacoes();
    renderDot();
  });
}

// ---------- FILTROS ----------
function setupFiltros() {
  const search = document.getElementById("searchInput");
  const selStatus = document.getElementById("filterStatus");
  const selConvenio = document.getElementById("filterConvenio");

  search.addEventListener("input", () => {
    estadoFiltro.busca = search.value.trim().toLowerCase();
    paginaAtual = 1;
    aplicarFiltros();
  });
  selStatus.addEventListener("change", () => {
    estadoFiltro.status = selStatus.value;
    paginaAtual = 1;
    aplicarFiltros();
  });
  selConvenio.addEventListener("change", () => {
    estadoFiltro.convenio = selConvenio.value;
    paginaAtual = 1;
    aplicarFiltros();
  });

  document.getElementById("btnNovo").addEventListener("click", () => {
    abrirModalNovo();
  });
  document.getElementById("btnExport").addEventListener("click", () => {
    exportarCSV();
  });
}

function atualizarKPIsPacientes() {
  const total = pacientes.length;
  const ativos = pacientes.filter(p => p.status === "Ativo").length;
  const inativos = pacientes.filter(p => p.status === "Inativo").length;
  
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1; // De 1 a 12
  const anoAtual = hoje.getFullYear();
  const novos = pacientes.filter(p => {
    if (p.cadastro && p.cadastro !== "—") {
      const parts = p.cadastro.split('/'); // Ex: DD/MM/YYYY
      if (parts.length === 3) {
        return parseInt(parts[1]) === mesAtual && parseInt(parts[2]) === anoAtual;
      }
    }
    return false;
  }).length;

  const semConvenio = pacientes.filter(p => p.convenios.includes("Particular") || p.convenios.includes("Outros") || p.convenios.length === 0).length;

  const kpiTotal = document.getElementById("kpiTotal");
  if (kpiTotal) {
    kpiTotal.textContent = total;
    document.getElementById("kpiAtivos").textContent = ativos;
    document.getElementById("kpiInativos").textContent = inativos;
    document.getElementById("kpiNovos").textContent = "+" + novos;
    document.getElementById("kpiSemConvenio").textContent = semConvenio;
  }
}

function aplicarFiltros() {
  pacientesFiltrados = pacientes.filter(p => {
    const matchBusca = !estadoFiltro.busca ||
      p.nome.toLowerCase().includes(estadoFiltro.busca) ||
      p.cpf.includes(estadoFiltro.busca) ||
      p.email.toLowerCase().includes(estadoFiltro.busca) ||
      p.id.toLowerCase().includes(estadoFiltro.busca) ||
      p.idCurto.toLowerCase().includes(estadoFiltro.busca);
    const matchStatus = !estadoFiltro.status || p.status === estadoFiltro.status;
    const matchConvenio = !estadoFiltro.convenio || p.convenios.includes(estadoFiltro.convenio);
    return matchBusca && matchStatus && matchConvenio;
  });

  // Atualiza contador
  const count = document.getElementById("tableCount");
  if (count) count.innerHTML = `Exibindo <strong>${pacientesFiltrados.length}</strong> paciente${pacientesFiltrados.length !== 1 ? "s" : ""}`;

  renderPaginas();
  renderView();
}

// ---------- VIEW TOGGLE ----------
function setupViewToggle() {
  const btnTable = document.getElementById("viewTable");
  const btnGrid = document.getElementById("viewGrid");
  btnTable.addEventListener("click", () => { viewAtual = "table"; btnTable.classList.add("active"); btnGrid.classList.remove("active"); renderView(); });
  btnGrid.addEventListener("click",  () => { viewAtual = "grid";  btnGrid.classList.add("active");  btnTable.classList.remove("active"); renderView(); });
}

function renderView() {
  if (viewAtual === "table") {
    document.getElementById("tableView").style.display = "block";
    document.getElementById("gridView").style.display  = "none";
    renderTabela();
  } else {
    document.getElementById("tableView").style.display = "none";
    document.getElementById("gridView").style.display  = "block";
    renderCards();
  }
}

// ---------- TABELA ----------
function renderTabela() {
  const tbody = document.getElementById("pacientesTableBody");
  const empty = document.getElementById("tableEmpty");
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = pacientesFiltrados.slice(inicio, inicio + POR_PAGINA);

  tbody.innerHTML = "";
  if (pagina.length === 0) { empty.style.display = "flex"; lucide.createIcons(); return; }
  empty.style.display = "none";

  pagina.forEach((p, idx) => {
    const cor = avatarColor(idx);
    const iniciais = p.nome.split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("");
    const medicosHtml = p.medicos.slice(0, 2).map(m =>
      `<span class="medico-tag">${m.nome.replace("Dr. ", "Dr. ").replace("Dra. ", "Dra. ")}</span>`
    ).join("") + (p.medicos.length > 2 ? `<span class="medico-tag extra">+${p.medicos.length - 2}</span>` : "");

    const conveniosHtml = p.convenios.map(c => {
      const s = CONVENIO_COLORS[c] || CONVENIO_COLORS["Outros"];
      return `<span class="convenio-tag" style="background:${s.bg};color:${s.color}">${c}</span>`;
    }).join("");

    const statusHtml = `<span class="status-badge-table ${p.status === "Ativo" ? "ativo" : "inativo"}">
      <span class="status-dot-sm"></span>${p.status}</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="pac-name-cell">
          <div class="pac-avatar" style="background:${cor.bg};color:${cor.txt}">${iniciais}</div>
          <div class="pac-name-info">
            <p class="pac-name">${p.nome}</p>
            <p class="pac-id">#${p.idCurto}</p>
          </div>
        </div>
      </td>
      <td><span class="cpf-masked">${p.cpf}</span></td>
      <td>
        <div class="contact-cell">
          <div class="contact-row"><i data-lucide="phone"></i>${p.tel}</div>
          <div class="contact-row"><i data-lucide="mail"></i>${p.email}</div>
        </div>
      </td>
      <td><div class="medicos-tags">${medicosHtml}</div></td>
      <td><div class="convenio-tags">${conveniosHtml}</div></td>
      <td>${statusHtml}</td>
      <td>
        <div class="row-actions">
          <button class="row-btn btn-detalhe" data-id="${p.id}" title="Ver detalhes"><i data-lucide="eye"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-detalhe").forEach(btn => {
    btn.addEventListener("click", () => abrirModal(btn.dataset.id));
  });

  lucide.createIcons();
}

// ---------- CARDS ----------
function renderCards() {
  const grid = document.getElementById("pacientesCardGrid");
  const empty = document.getElementById("gridEmpty");
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = pacientesFiltrados.slice(inicio, inicio + POR_PAGINA);

  grid.innerHTML = "";
  if (pagina.length === 0) { empty.style.display = "flex"; lucide.createIcons(); return; }
  empty.style.display = "none";

  pagina.forEach((p, idx) => {
    const cor = avatarColor(idx);
    const iniciais = p.nome.split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("");
    const statusHtml = `<span class="status-badge-table ${p.status === "Ativo" ? "ativo" : "inativo"}">
      <span class="status-dot-sm"></span>${p.status}</span>`;
    const conveniosHtml = p.convenios.map(c => {
      const s = CONVENIO_COLORS[c] || CONVENIO_COLORS["Outros"];
      return `<span class="convenio-tag" style="background:${s.bg};color:${s.color};font-size:11px;padding:2px 6px;border-radius:4px">${c}</span>`;
    }).join(" ");
    const medicosStr = p.medicos.map(m => m.nome).join(", ");

    const card = document.createElement("div");
    card.className = "pac-card";
    card.innerHTML = `
      <div class="pac-card-header">
        <div class="pac-card-avatar" style="background:${cor.bg};color:${cor.txt}">${iniciais}</div>
        <div>
          <p class="pac-card-name">${p.nome}</p>
          <p class="pac-card-id">#${p.idCurto}</p>
        </div>
        <div class="pac-card-status">${statusHtml}</div>
      </div>
      <div class="pac-card-body">
        <div class="pac-card-row"><i data-lucide="phone"></i>${p.tel}</div>
        <div class="pac-card-row"><i data-lucide="mail"></i>${p.email}</div>
        <div class="pac-card-divider"></div>
        <div class="pac-card-row"><i data-lucide="stethoscope"></i><span style="font-size:11.5px">${medicosStr}</span></div>
        <div class="pac-card-row" style="flex-wrap:wrap;gap:4px"><i data-lucide="building-2"></i><span style="display:flex;flex-wrap:wrap;gap:4px">${conveniosHtml}</span></div>
      </div>
    `;
    card.addEventListener("click", () => abrirModal(p.id));
    grid.appendChild(card);
  });

  lucide.createIcons();
}

// ---------- PAGINAÇÃO ----------
function setupPaginacao() {
  document.getElementById("pagPrev").addEventListener("click", () => {
    if (paginaAtual > 1) { paginaAtual--; renderPaginas(); renderView(); }
  });
  document.getElementById("pagNext").addEventListener("click", () => {
    const total = Math.ceil(pacientesFiltrados.length / POR_PAGINA);
    if (paginaAtual < total) { paginaAtual++; renderPaginas(); renderView(); }
  });
}

function renderPaginas() {
  const total = Math.ceil(pacientesFiltrados.length / POR_PAGINA);
  const container = document.getElementById("pagPages");
  container.innerHTML = "";
  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("button");
    btn.className = "pag-page" + (i === paginaAtual ? " active" : "");
    btn.textContent = i;
    btn.addEventListener("click", () => { paginaAtual = i; renderPaginas(); renderView(); });
    container.appendChild(btn);
  }
  document.getElementById("pagPrev").disabled = paginaAtual === 1;
  document.getElementById("pagNext").disabled = paginaAtual >= total;
}

// ---------- MODAL ----------
function setupModal() {
  document.getElementById("modalClose").addEventListener("click", fecharModal);
  document.getElementById("modalCancelar").addEventListener("click", fecharModal);
  document.getElementById("modalOverlay").addEventListener("click", e => {
    if (e.target === document.getElementById("modalOverlay")) fecharModal();
  });
  document.getElementById("modalEditar").addEventListener("click", () => {
    const id = document.getElementById("modalPaciente").dataset.id;
    fecharModal();
    abrirModalNovo(id);
  });
  document.getElementById("modalToggleStatus").addEventListener("click", alternarStatusPaciente);

  document.querySelectorAll(".modal-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".modal-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
    });
  });
}

function abrirModal(id) {
  const p = pacientes.find(x => x.id === id);
  if (!p) return;

  // Salva o UUID do paciente de forma oculta no HTML do modal para os scripts de navegação.
  document.getElementById("modalPaciente").dataset.id = id;

  const cor = avatarColor(pacientes.indexOf(p));
  const iniciais = p.nome.split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("");

  const av = document.getElementById("modalAvatar");
  av.textContent = iniciais;
  av.style.background = cor.bg;
  av.style.color = cor.txt;

  document.getElementById("modalNome").textContent = p.nome;
  document.getElementById("modalSubtitle").textContent = `#${p.idCurto} · Cadastrado em ${p.cadastro}`;

  // Tab identificação
  document.getElementById("dNome").textContent   = p.nome;
  document.getElementById("dCpf").textContent    = p.cpf;
  document.getElementById("dNasc").textContent   = p.nasc;
  document.getElementById("dSexo").textContent   = p.sexo;
  document.getElementById("dTel").textContent    = p.tel;
  document.getElementById("dEmail").textContent  = p.email;
  document.getElementById("dEnd").textContent    = p.end;
  document.getElementById("dCadastro").textContent = p.cadastro;
  const dStatus = document.getElementById("dStatus");
  dStatus.innerHTML = `<span class="status-badge-table ${p.status === "Ativo" ? "ativo" : "inativo"}"><span class="status-dot-sm"></span>${p.status}</span>`;

  const btnStatus = document.getElementById("modalToggleStatus");
  if (p.status === "Inativo") {
    btnStatus.style.display = "none";
  } else {
    btnStatus.style.display = "inline-flex";
  }

  // Tab médicos
  const medList = document.getElementById("detalhesMedicos");
  medList.innerHTML = "";
  p.medicos.forEach(m => {
    const d = document.createElement("div");
    d.className = "detail-card";
    d.innerHTML = `
      <div class="detail-card-icon" style="background:#EFF6FF"><i data-lucide="stethoscope" style="color:#1D4ED8"></i></div>
      <div class="detail-card-info">
        <p class="detail-card-name">${m.nome}</p>
        <p class="detail-card-sub">${m.esp}</p>
      </div>
      <span class="detail-card-badge" style="background:#ECFDF5;color:#059669">Responsável</span>
    `;
    medList.appendChild(d);
  });

  // Tab convênios
  const convList = document.getElementById("detalhesConvenios");
  convList.innerHTML = "";
  p.convenios.forEach(c => {
    const s = CONVENIO_COLORS[c] || CONVENIO_COLORS["Outros"];
    const d = document.createElement("div");
    d.className = "detail-card";
    d.innerHTML = `
      <div class="detail-card-icon" style="background:${s.bg}"><i data-lucide="building-2" style="color:${s.color}"></i></div>
      <div class="detail-card-info">
        <p class="detail-card-name">${c}</p>
        <p class="detail-card-sub">Plano de saúde ativo</p>
      </div>
      <span class="detail-card-badge" style="background:${s.bg};color:${s.color}">Ativo</span>
    `;
    convList.appendChild(d);
  });

  // Resetar para primeira tab
  document.querySelectorAll(".modal-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelector(".modal-tab[data-tab='info']").classList.add("active");
  document.getElementById("tab-info").classList.add("active");

  document.getElementById("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
  lucide.createIcons();
}

function fecharModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

// ---------- EXPORT CSV ----------
function exportarCSV() {
  const header = ["ID", "Nome", "CPF", "Nascimento", "Sexo", "Telefone", "Email", "Médicos", "Convênios", "Status", "Cadastro"];
  const rows = pacientesFiltrados.map(p => [
    p.idCurto, p.nome, p.cpf, p.nasc, p.sexo, p.tel, p.email,
    p.medicos.map(m => m.nome).join(" | "),
    p.convenios.join(" | "),
    p.status, p.cadastro
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "pacientes_aura.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ---------- MODAL NOVO PACIENTE ----------
function setupModalNovo() {
  const btnSalvar = document.getElementById("btnSalvarNovo");
  if(btnSalvar) btnSalvar.addEventListener("click", salvarNovoPaciente);
  
  const btnCancelar = document.getElementById("btnCancelarNovo");
  if(btnCancelar) btnCancelar.addEventListener("click", fecharModalNovo);
  
  const overlay = document.getElementById("modalNovoOverlay");
  if(overlay) overlay.addEventListener("click", e => {
      if (e.target === overlay) fecharModalNovo();
  });
  
  const btnClose = document.getElementById("modalNovoClose");
  if(btnClose) btnClose.addEventListener("click", fecharModalNovo);

  const selectParentesco = document.getElementById("novoPacRespParentesco");
  if(selectParentesco) {
    selectParentesco.addEventListener("change", (e) => {
      const boxOutro = document.getElementById("boxParentescoOutro");
      if(e.target.value === "Outro") {
        boxOutro.style.display = "block";
      } else {
        boxOutro.style.display = "none";
      }
    });
  }
}

function abrirModalNovo(id = null) {
  const overlay = document.getElementById("modalNovoOverlay");
  if (!overlay) {
    showToast("O HTML do modal 'Novo Paciente' não foi encontrado na página.", "error");
    return;
  }
  
  editPacienteId = id && typeof id === 'string' ? id : null;
  const titulo = document.querySelector("#modalNovoOverlay .modal-title");
  if (titulo) titulo.textContent = editPacienteId ? "Editar Paciente" : "Novo Paciente";
  
  // Limpa os campos corrigindo o bug do map e inserindo os novos
  ['novoPacNome', 'novoPacCpf', 'novoPacNasc', 'novoPacConvenio', 'novoPacMedico', 'novoPacRespNome', 'novoPacRespTel', 'novoPacRespParentesco', 'novoPacRespParentescoOutro'].forEach(campoId => {
    const el = document.getElementById(campoId);
    if (el) el.value = '';
  });
  const elSexo = document.getElementById('novoPacSexo');
  if(elSexo) elSexo.value = 'M';

  const boxOutro = document.getElementById("boxParentescoOutro");
  if(boxOutro) boxOutro.style.display = "none";

  if (editPacienteId) {
    const p = pacientes.find(x => x.id === editPacienteId);
    if (p) {
      document.getElementById("novoPacNome").value = p.nome;
      if (p.cpf && p.cpf !== "Não informado") document.getElementById("novoPacCpf").value = p.cpf.replace(/\D/g, "");
      if (p.nasc !== "Não informado") {
        document.getElementById("novoPacNasc").value = p.nasc.split('/').reverse().join('-');
      }
      if (elSexo) elSexo.value = p.sexo === "Masculino" ? "M" : "F";
      
      const elConv = document.getElementById("novoPacConvenio");
      if (elConv && p.instituicao_id) elConv.value = p.instituicao_id;
      
      const elMed = document.getElementById("novoPacMedico");
      if (elMed && p.cadastrado_por_id) elMed.value = p.cadastrado_por_id;
    }
  }

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function fecharModalNovo() {
  const overlay = document.getElementById("modalNovoOverlay");
  if(overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function setupMascarasNovoPaciente() {
  const cpfInput = document.getElementById("novoPacCpf");
  const telInput = document.getElementById("novoPacRespTel");

  if(cpfInput) {
      cpfInput.addEventListener("input", (e) => {
          let v = e.target.value.replace(/\D/g, "");
          if (v.length > 11) v = v.substring(0, 11);
          v = v.replace(/(\d{3})(\d)/, "$1.$2");
          v = v.replace(/(\d{3})(\d)/, "$1.$2");
          v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
          e.target.value = v;
      });
  }

  if(telInput) {
      telInput.addEventListener("input", (e) => {
          let v = e.target.value.replace(/\D/g, "");
          if (v.length > 11) v = v.substring(0, 11);
          v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
          v = v.replace(/(\d{4,5})(\d{4})$/, "$1-$2");
          e.target.value = v;
      });
  }
}

async function salvarNovoPaciente() {
  const nome = document.getElementById("novoPacNome").value.trim();
  const cpf = document.getElementById("novoPacCpf").value.replace(/\D/g, "");
  const nasc = document.getElementById("novoPacNasc").value;
  const sexo = document.getElementById("novoPacSexo").value;
  
  const respNome = document.getElementById("novoPacRespNome") ? document.getElementById("novoPacRespNome").value.trim() : "";
  const respTel = document.getElementById("novoPacRespTel") ? document.getElementById("novoPacRespTel").value.replace(/\D/g, "") : "";
  let respParentesco = document.getElementById("novoPacRespParentesco") ? document.getElementById("novoPacRespParentesco").value : "Não informado";
  
  if (respParentesco === "Outro") {
    const txtOutro = document.getElementById("novoPacRespParentescoOutro");
    respParentesco = txtOutro && txtOutro.value.trim() !== "" ? txtOutro.value.trim() : "Outro";
  }

  if (!nome || !cpf || !nasc || !sexo) {
    showToast("Preencha todos os campos obrigatórios básicos.", "error");
    return;
  }

  // Validação de Idade (menor de 18 precisa de responsável)
  const hoje = new Date();
  const dataNascimento = new Date(nasc);
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const mes = hoje.getMonth() - dataNascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
  }

  if (idade < 18) {
      if (!respNome || !respTel || respParentesco === "Não informado") {
          showToast("Para pacientes menores de 18 anos, os dados do responsável são obrigatórios.", "error");
          return;
      }
  }

  const instituicao_id = parseInt(document.getElementById("novoPacConvenio").value);
  const cadastrado_por_id = parseInt(document.getElementById("novoPacMedico").value);

  if (isNaN(instituicao_id) || isNaN(cadastrado_por_id)) {
      showToast("Selecione um convênio e um médico responsável.", "error");
      return;
  }

  let responsaveis = null;
  if (respNome) {
    responsaveis = [{ nome: respNome, telefone: respTel || null, parentesco: respParentesco }];
  }

  const payload = {
    nome, cpf: cpf || null, data_nascimento: nasc, sexo_biologico: sexo,
    instituicao_id, cadastrado_por_id, responsaveis
  };

  try {
    const token = localStorage.getItem("aura_token");
    const url = editPacienteId ? `${API_URL}/pacientes/${editPacienteId}` : `${API_URL}/pacientes/`;
    const method = editPacienteId ? "PUT" : "POST";
    
    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      fecharModalNovo();
      await carregarDados(); // Atualiza a tabela imediatamente e aguarda finalizar
      showToast(editPacienteId ? "Paciente atualizado com sucesso." : "Paciente salvo com sucesso!");
    } else {
      let errorMsg = "Erro no servidor. Verifique os logs (Terminal do Python).";
      try {
        const err = await res.json();
        errorMsg = JSON.stringify(err.detail || err);
      } catch(e) {
        errorMsg = await res.text(); // Lê o erro bruto caso o FastAPI tenha crashado feio
      }
      showToast("Erro retornado: " + errorMsg.substring(0, 150), "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Erro de conexão ao tentar salvar o paciente.", "error");
  }
}

function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-msg");
  const icon = document.getElementById("toast-icon");
  
  if (msgEl) msgEl.textContent = msg;
  toast.className = `toast ${type}`;
  
  if (icon) {
      if (type === "success") {
          icon.setAttribute("data-lucide", "check-circle");
          toast.style.background = ""; toast.style.color = ""; toast.style.borderColor = "";
      } else {
          icon.setAttribute("data-lucide", "alert-circle");
          toast.style.background = "#FEF2F2"; toast.style.color = "#DC2626"; toast.style.borderColor = "#FECACA";
      }
      lucide.createIcons();
  }
  
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3500);
}

// ---------- INATIVAR PACIENTE ----------
async function alternarStatusPaciente() {
  const id = document.getElementById("modalPaciente").dataset.id;
  if (!id) return;

  const p = pacientes.find(x => x.id === id);
  if (!p) return;

  if (!confirm(`Deseja realmente desativar o paciente ${p.nome}?`)) return;

  try {
    const token = localStorage.getItem("aura_token");
    const res = await fetch(`${API_URL}/pacientes/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      fecharModal();
      await carregarDados();
      showToast("Paciente inativado com sucesso.");
    } else {
      const err = await res.json();
      showToast("Erro ao inativar paciente: " + JSON.stringify(err.detail), "error");
    }
  } catch (e) {
    console.error(e);
    showToast("Erro de conexão ao tentar inativar o paciente.", "error");
  }
}
