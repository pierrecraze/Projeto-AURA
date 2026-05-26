/* ─── Banco de Dados Local (Mock Relacional) ─────────────────── */
let convenios = [
    { id: 1, nome: "Unimed", cnpj: "04.487.255/0001-81", status: "Ativo" },
    { id: 2, nome: "Bradesco Saúde", cnpj: "92.693.118/0001-60", status: "Ativo" },
    { id: 3, nome: "SulAmérica", cnpj: "01.685.053/0001-56", status: "Ativo" },
    { id: 4, nome: "Amil Assistência", cnpj: "29.309.127/0001-79", status: "Inativo" },
    { id: 5, nome: "Particular (Sem Convênio)", cnpj: "Isento", status: "Ativo" },
];

let medicos = [
    { id: 1, nome: "Dr. Carlos Eduardo Mendes", doc: "CRM PR-45.821", status: "Ativo", convenios: [1, 2, 5] },
    { id: 2, nome: "Dra. Patrícia Andrade", doc: "CRM SP-71.203", status: "Ativo", convenios: [1, 3] },
    { id: 3, nome: "Dr. Rodrigo Figueiredo", doc: "CRM PR-38.104", status: "Ativo", convenios: [2, 5] },
    { id: 4, nome: "Dra. Mariana Rocha", doc: "CRM PR-55.012", status: "Inativo", convenios: [4] },
];

let pacientes = [
    { id: 1, nome: "Lucas Henrique Oliveira", doc: "CPF 041.***.***-77", status: "Ativo", convenios: [1] },
    { id: 2, nome: "Sofia Beatriz Almeida", doc: "CPF 132.***.***-21", status: "Ativo", convenios: [2] },
    { id: 3, nome: "Ana Clara Ferreira", doc: "CPF 204.***.***-14", status: "Inativo", convenios: [1] },
    { id: 4, nome: "Gabriel Torres Lima", doc: "CPF 098.***.***-65", status: "Ativo", convenios: [5] },
];

/* ─── Estado e Roteamento (History API) ─────────────────────── */
// Lê a URL atual caso o utilizador faça "Refresh" na página de um convénio
const urlParams = new URLSearchParams(window.location.search);
const convenioIdDaUrl = urlParams.get('convenio');

let state = {
    view: convenioIdDaUrl ? 'detalhes' : 'grid',
    activeConvenioId: convenioIdDaUrl ? parseInt(convenioIdDaUrl) : null,
    activeTab: 'medicos', 
    editingPerfil: null 
};

// Regista o estado inicial no histórico do navegador assim que a página carrega
window.history.replaceState({ view: state.view, id: state.activeConvenioId }, '', window.location.search || '?view=grid');

// Ouve o evento do botão "Voltar" ou "Avançar" do navegador
window.addEventListener('popstate', (event) => {
    if (event.state) {
        state.view = event.state.view;
        state.activeConvenioId = event.state.id;
        renderApp();
    }
});

/* ─── Utilitários ───────────────────────────────────────────── */
const initials = (n) => n.replace(/^Dr[a]?\. /, "").split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const avatarBg = (id) => ["#1D4ED8","#0369A1","#6D28D9","#047857","#B45309","#9D174D"][id % 6];
const getBadge = (status) => `<span class="status-badge ${status.toLowerCase()}"><span class="dot"></span>${status}</span>`;

/* ─── Inicialização ─────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("pt-BR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    document.getElementById("current-date").textContent = today;
    renderApp();
});

/* ─── Lógica de Renderização Principal ─────────────────────── */
function renderApp() {
    const viewGrid = document.getElementById("view-convenios");
    const viewDetalhes = document.getElementById("view-detalhes");

    if (state.view === 'grid') {
        viewGrid.classList.remove("hidden");
        viewDetalhes.classList.add("hidden");
        renderConveniosGrid();
    } else {
        viewGrid.classList.add("hidden");
        viewDetalhes.classList.remove("hidden");
        renderConvenioDetalhes();
    }
    lucide.createIcons();
}

/* ─── Tela 1: Grid de Convênios ─────────────────────────────── */
function renderConveniosGrid() {
    document.getElementById("stats-convenios").textContent = `${convenios.length} convénios registados no sistema`;
    const grid = document.getElementById("convenios-grid");
    grid.innerHTML = "";

    convenios.forEach(cv => {
        const countMed = medicos.filter(m => m.convenios.includes(cv.id)).length;
        const countPac = pacientes.filter(p => p.convenios.includes(cv.id)).length;

        const card = document.createElement("div");
        card.className = "convenio-card";
        card.onclick = () => openConvenio(cv.id);
        
        card.innerHTML = `
            <div class="cv-header">
                <div>
                    <div class="cv-icon"><i data-lucide="building"></i></div>
                    <h2 class="cv-title">${cv.nome}</h2>
                    <p class="cv-cnpj">${cv.cnpj}</p>
                </div>
                ${getBadge(cv.status)}
            </div>
            <div class="cv-stats">
                <div class="cv-stat">
                    <span class="cv-stat-val">${countMed}</span>
                    <span class="cv-stat-label">Médicos</span>
                </div>
                <div class="cv-stat">
                    <span class="cv-stat-val">${countPac}</span>
                    <span class="cv-stat-label">Pacientes</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Navegar para Detalhes (Adiciona ao Histórico)
function openConvenio(id) {
    state.activeConvenioId = id;
    state.activeTab = 'medicos';
    state.view = 'detalhes';
    
    // Altera a URL no navegador sem recarregar a página
    window.history.pushState({ view: 'detalhes', id: id }, '', `?convenio=${id}`);
    
    renderApp();
}

// Navegar de volta para Grid (Adiciona ao Histórico)
function goBackToConvenios() {
    state.view = 'grid';
    state.activeConvenioId = null;
    
    // Altera a URL no navegador de volta para a view principal
    window.history.pushState({ view: 'grid', id: null }, '', `?view=grid`);
    
    renderApp();
}

/* ─── Tela 2: Detalhes do Convénio (Hub Interno) ────────────── */
function renderConvenioDetalhes() {
    const cv = convenios.find(c => c.id === state.activeConvenioId);
    if (!cv) return goBackToConvenios();

    document.getElementById("detalhe-nome-convenio").textContent = cv.nome;
    document.getElementById("detalhe-titulo").textContent = cv.nome;
    document.getElementById("detalhe-cnpj").textContent = cv.cnpj;

    const medicosVinculados = medicos.filter(m => m.convenios.includes(cv.id));
    const pacientesVinculados = pacientes.filter(p => p.convenios.includes(cv.id));

    document.getElementById("badge-tab-medicos").textContent = medicosVinculados.length;
    document.getElementById("badge-tab-pacientes").textContent = pacientesVinculados.length;

    document.getElementById("tab-medicos").className = `tab ${state.activeTab === 'medicos' ? 'active' : ''}`;
    document.getElementById("tab-pacientes").className = `tab ${state.activeTab === 'pacientes' ? 'active' : ''}`;

    const thead = document.getElementById("dynamic-thead");
    const tbody = document.getElementById("dynamic-tbody");

    if (state.activeTab === 'medicos') {
        thead.innerHTML = `<tr><th>Médico Vinculado</th><th>CRM</th><th>Status no Sistema</th><th style="text-align:right">Ação</th></tr>`;
        renderTbody(tbody, medicosVinculados, 'medico');
    } else {
        thead.innerHTML = `<tr><th>Paciente Vinculado</th><th>CPF</th><th>Status no Sistema</th><th style="text-align:right">Ação</th></tr>`;
        renderTbody(tbody, pacientesVinculados, 'paciente');
    }
}

function renderTbody(tbody, lista, tipo) {
    tbody.innerHTML = "";
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#94A3B8;">Nenhum ${tipo} vinculado a este grupo.</td></tr>`;
        return;
    }

    lista.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="td-flex">
                    <div class="user-avatar" style="background:${avatarBg(item.id)}">${initials(item.nome)}</div>
                    <div>
                        <p class="user-name">${item.nome}</p>
                        <p class="user-sub">ID #${String(item.id).padStart(4, '0')}</p>
                    </div>
                </div>
            </td>
            <td><code style="background:#F1F5F9; padding:2px 6px; border-radius:4px; font-family:monospace; font-size:12px;">${item.doc}</code></td>
            <td>${getBadge(item.status)}</td>
            <td style="text-align:right;">
                <button class="btn-icon" title="Editar Perfil / Vínculos" onclick="openModalPerfil('${tipo}', ${item.id})">
                    <i data-lucide="edit-3"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function switchTab(tabName) {
    state.activeTab = tabName;
    renderApp();
}

/* ─── Modal de Edição de Perfil ─────────────────────────────── */
window.openModalPerfil = function(tipo, id) {
    const list = tipo === 'medico' ? medicos : pacientes;
    const item = list.find(x => x.id === id);
    if (!item) return;

    state.editingPerfil = { tipo, ...item };

    document.getElementById("modal-perfil-title").textContent = `Editar ${tipo === 'medico' ? 'Médico' : 'Paciente'}`;
    document.getElementById("perfil-nome").value = item.nome;
    document.getElementById("perfil-doc-label").textContent = tipo === 'medico' ? 'CRM' : 'CPF';
    document.getElementById("perfil-doc").value = item.doc;
    document.getElementById("perfil-status").value = item.status;

    const chkGrid = document.getElementById("perfil-convenios-list");
    chkGrid.innerHTML = "";
    
    convenios.forEach(cv => {
        const isChecked = item.convenios.includes(cv.id);
        const div = document.createElement("label");
        div.className = `chk-item ${isChecked ? 'checked' : ''}`;
        div.innerHTML = `
            <input type="checkbox" value="${cv.id}" ${isChecked ? 'checked' : ''} onchange="toggleCheckbox(this)">
            <span>${cv.nome}</span>
        `;
        chkGrid.appendChild(div);
    });

    document.getElementById("modal-perfil").classList.remove("hidden");
    lucide.createIcons();
};

window.toggleCheckbox = function(input) {
    if(input.checked) input.parentElement.classList.add("checked");
    else input.parentElement.classList.remove("checked");
};

window.closeModalPerfil = function() {
    document.getElementById("modal-perfil").classList.add("hidden");
    state.editingPerfil = null;
};

window.savePerfil = function() {
    if (!state.editingPerfil) return;

    const novoNome = document.getElementById("perfil-nome").value;
    const novoStatus = document.getElementById("perfil-status").value;
    const checkboxes = document.querySelectorAll('#perfil-convenios-list input[type="checkbox"]:checked');
    const novosConvenios = Array.from(checkboxes).map(cb => parseInt(cb.value));

    const list = state.editingPerfil.tipo === 'medico' ? medicos : pacientes;
    const idx = list.findIndex(x => x.id === state.editingPerfil.id);
    
    if (idx !== -1) {
        list[idx].nome = novoNome;
        list[idx].status = novoStatus;
        list[idx].convenios = novosConvenios;
    }

    closeModalPerfil();
    renderApp(); 
    showToast("Perfil atualizado e vinculado com sucesso.");
};

/* ─── Toasts e UX ───────────────────────────────────────────── */
function showToast(msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toast-msg").textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3500);
}

window.openModalAddConvenio = function() {
    alert("Nesta versão de demonstração, o fluxo principal de Arquitetura de Convénios já está mapeado no HTML/CSS. A criação seria idêntica ao modal de perfil.");
};