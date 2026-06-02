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

const pacientes = [
  {
    id: "PAC-0001", nome: "Ana Paula Ferreira", cpf: "***.***.***-01",
    nasc: "12/03/1985", sexo: "Feminino", tel: "(41) 99812-3456", email: "ana.ferreira@email.com",
    end: "Rua das Flores, 142 – Batel, Curitiba/PR", status: "Ativo", cadastro: "10/01/2023",
    medicos: [{ nome: "Dr. Carlos Mendes", esp: "Clínica Geral" }, { nome: "Dra. Juliana Costa", esp: "Psiquiatria" }],
    convenios: ["Unimed", "Bradesco Saúde"],
  },
  {
    id: "PAC-0002", nome: "Bruno Henrique Lima", cpf: "***.***.***-02",
    nasc: "07/08/1990", sexo: "Masculino", tel: "(41) 98765-4321", email: "bruno.lima@email.com",
    end: "Av. Sete de Setembro, 300 – Centro, Curitiba/PR", status: "Ativo", cadastro: "15/02/2023",
    medicos: [{ nome: "Dr. Roberto Lima", esp: "Cardiologia" }],
    convenios: ["SulAmérica"],
  },
  {
    id: "PAC-0003", nome: "Carla Souza Mendes", cpf: "***.***.***-03",
    nasc: "22/11/1978", sexo: "Feminino", tel: "(41) 97654-3210", email: "carla.mendes@email.com",
    end: "Rua Voluntários da Pátria, 55 – Juvevê, Curitiba/PR", status: "Inativo", cadastro: "20/03/2023",
    medicos: [{ nome: "Dra. Ana Ferreira", esp: "Pediatria" }],
    convenios: ["Particular"],
  },
  {
    id: "PAC-0004", nome: "Diego Alves Costa", cpf: "***.***.***-04",
    nasc: "14/06/1995", sexo: "Masculino", tel: "(41) 96543-2109", email: "diego.costa@email.com",
    end: "Rua Marechal Floriano, 800 – Portão, Curitiba/PR", status: "Ativo", cadastro: "02/04/2023",
    medicos: [{ nome: "Dr. Marcos Oliveira", esp: "Neurologia" }, { nome: "Dr. Carlos Mendes", esp: "Clínica Geral" }],
    convenios: ["Bradesco Saúde"],
  },
  {
    id: "PAC-0005", nome: "Elaine Rodrigues Silva", cpf: "***.***.***-05",
    nasc: "30/01/1982", sexo: "Feminino", tel: "(41) 95432-1098", email: "elaine.silva@email.com",
    end: "Rua Ébano Pereira, 21 – Centro, Curitiba/PR", status: "Ativo", cadastro: "18/04/2023",
    medicos: [{ nome: "Dra. Juliana Costa", esp: "Psiquiatria" }],
    convenios: ["Unimed"],
  },
  {
    id: "PAC-0006", nome: "Fábio Nascimento Pereira", cpf: "***.***.***-06",
    nasc: "09/09/1988", sexo: "Masculino", tel: "(41) 94321-0987", email: "fabio.pereira@email.com",
    end: "Rua Visconde do Rio Branco, 44 – Mercês, Curitiba/PR", status: "Ativo", cadastro: "01/05/2023",
    medicos: [{ nome: "Dr. Roberto Lima", esp: "Cardiologia" }, { nome: "Dra. Ana Ferreira", esp: "Pediatria" }],
    convenios: ["SulAmérica", "Unimed"],
  },
  {
    id: "PAC-0007", nome: "Gabriela Torres Nunes", cpf: "***.***.***-07",
    nasc: "17/04/1993", sexo: "Feminino", tel: "(41) 93210-9876", email: "gabriela.nunes@email.com",
    end: "Av. Água Verde, 1200 – Água Verde, Curitiba/PR", status: "Ativo", cadastro: "14/05/2023",
    medicos: [{ nome: "Dr. Carlos Mendes", esp: "Clínica Geral" }],
    convenios: ["Particular"],
  },
  {
    id: "PAC-0008", nome: "Henrique Campos Ribeiro", cpf: "***.***.***-08",
    nasc: "03/12/1975", sexo: "Masculino", tel: "(41) 92109-8765", email: "henrique.ribeiro@email.com",
    end: "Rua Comendador Araújo, 88 – Centro, Curitiba/PR", status: "Inativo", cadastro: "28/05/2023",
    medicos: [{ nome: "Dr. Marcos Oliveira", esp: "Neurologia" }],
    convenios: ["Bradesco Saúde"],
  },
  {
    id: "PAC-0009", nome: "Isabela Gonçalves Martins", cpf: "***.***.***-09",
    nasc: "25/07/1997", sexo: "Feminino", tel: "(41) 91098-7654", email: "isabela.martins@email.com",
    end: "Rua João Negrão, 105 – Centro Cívico, Curitiba/PR", status: "Ativo", cadastro: "10/06/2023",
    medicos: [{ nome: "Dra. Ana Ferreira", esp: "Pediatria" }, { nome: "Dra. Juliana Costa", esp: "Psiquiatria" }],
    convenios: ["Unimed", "Particular"],
  },
  {
    id: "PAC-0010", nome: "João Pedro Almeida", cpf: "***.***.***-10",
    nasc: "11/02/1980", sexo: "Masculino", tel: "(41) 90987-6543", email: "joao.almeida@email.com",
    end: "Rua Cruz Machado, 310 – São Francisco, Curitiba/PR", status: "Ativo", cadastro: "22/06/2023",
    medicos: [{ nome: "Dr. Carlos Mendes", esp: "Clínica Geral" }],
    convenios: ["SulAmérica"],
  },
  {
    id: "PAC-0011", nome: "Karen Lopes Vieira", cpf: "***.***.***-11",
    nasc: "06/10/1991", sexo: "Feminino", tel: "(41) 99111-2233", email: "karen.vieira@email.com",
    end: "Rua Imaculada Conceição, 1155 – Prado Velho, Curitiba/PR", status: "Ativo", cadastro: "05/07/2023",
    medicos: [{ nome: "Dra. Juliana Costa", esp: "Psiquiatria" }],
    convenios: ["Bradesco Saúde"],
  },
  {
    id: "PAC-0012", nome: "Lucas Martins de Oliveira", cpf: "***.***.***-12",
    nasc: "28/03/1986", sexo: "Masculino", tel: "(41) 98222-3344", email: "lucas.oliveira@email.com",
    end: "Av. Iguaçu, 420 – Rebouças, Curitiba/PR", status: "Inativo", cadastro: "19/07/2023",
    medicos: [{ nome: "Dr. Roberto Lima", esp: "Cardiologia" }],
    convenios: ["Particular"],
  },
];

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

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  setupDate();
  setupSidebar();
  setupProfile();
  setupNotificacoes();
  setupFiltros();
  setupViewToggle();
  setupModal();
  setupPaginacao();
  aplicarFiltros();
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
    alert("Funcionalidade de cadastro em desenvolvimento.");
  });
  document.getElementById("btnExport").addEventListener("click", () => {
    exportarCSV();
  });
}

function aplicarFiltros() {
  pacientesFiltrados = pacientes.filter(p => {
    const matchBusca = !estadoFiltro.busca ||
      p.nome.toLowerCase().includes(estadoFiltro.busca) ||
      p.cpf.includes(estadoFiltro.busca) ||
      p.email.toLowerCase().includes(estadoFiltro.busca) ||
      p.id.toLowerCase().includes(estadoFiltro.busca);
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
            <p class="pac-id">${p.id}</p>
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
          <p class="pac-card-id">${p.id}</p>
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
    alert("Edição em desenvolvimento.");
  });
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

  const cor = avatarColor(pacientes.indexOf(p));
  const iniciais = p.nome.split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("");

  const av = document.getElementById("modalAvatar");
  av.textContent = iniciais;
  av.style.background = cor.bg;
  av.style.color = cor.txt;

  document.getElementById("modalNome").textContent = p.nome;
  document.getElementById("modalSubtitle").textContent = `${p.id} · Cadastrado em ${p.cadastro}`;

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
    p.id, p.nome, p.cpf, p.nasc, p.sexo, p.tel, p.email,
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
