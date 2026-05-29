/* ─── Configuração da API ────────────────────────────────────── */
const API_URL = "http://localhost:8000/api";

// Nossas variáveis agora começam vazias e serão preenchidas pelo servidor
let convenios = [];
let medicos = [];
let pacientes = [];

/* ─── Busca e Tradução de Dados (O Motor Full-Stack) ───────── */
async function carregarDadosDaAPI() {
    try {
        // 1. Pegamos a pulseira no cofre
        const token = localStorage.getItem('aura_token');
        
        // 2. Preparamos o envelope de segurança
        const opcoesComToken = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        };

        // 3. O motoboy busca os 3 pacotes ao mesmo tempo COM o token
        const [resGrupos, resMedicos, resPacientes] = await Promise.all([
            fetch(`${API_URL}/grupos/`, opcoesComToken),
            fetch(`${API_URL}/medicos/`, opcoesComToken),
            fetch(`${API_URL}/pacientes/`, opcoesComToken)
        ]);

        // 4. Verificação de Segurança (Se alguma delas der 401, expulsa o usuário)
        if (resGrupos.status === 401 || resMedicos.status === 401 || resPacientes.status === 401) {
            console.error('Sessão expirada. Chutando para o Login.');
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/static/login.html'); 
            return; 
        }

        // Abrindo os pacotes JSON
        const dbGrupos = await resGrupos.json();
        const dbMedicos = await resMedicos.json();
        const dbPacientes = await resPacientes.json();

        // Traduzindo Grupos
        convenios = dbGrupos.map(g => ({
            id: g.id,
            nome: g.nome,
            cnpj: "00.000.000/0000-00", 
            status: g.status || "Ativo"
        }));

        // Traduzindo Médicos
        medicos = dbMedicos.map(m => ({
            id: m.id,
            nome: m.nome,
            doc: `CRM ${m.crm}`, 
            status: m.status || "Ativo",
            convenios: m.grupos.map(nomeGrupo => {
                const grupoEncontrado = convenios.find(c => c.nome === nomeGrupo);
                return grupoEncontrado ? grupoEncontrado.id : null;
            }).filter(id => id !== null)
        }));

        // Traduzindo Pacientes
        pacientes = dbPacientes.map(p => ({
            id: p.id,
            nome: p.nome,
            doc: `CPF ${p.cpf}`, 
            status: p.status,
            convenios: p.grupos.map(nomeGrupo => {
                const grupoEncontrado = convenios.find(c => c.nome === nomeGrupo);
                return grupoEncontrado ? grupoEncontrado.id : null;
            }).filter(id => id !== null)
        }));

        console.log("Integração concluída!", { convenios, medicos, pacientes });
        
        renderApp();

    } catch (erro) {
        console.error("Erro ao carregar dados do servidor:", erro);
        showToast("Erro de conexão com o servidor. Verifique se o Uvicorn está rodando.");
    }
}


/* ─── Estado e Roteamento (History API) ─────────────────────── */
const urlParams = new URLSearchParams(window.location.search);
const convenioIdDaUrl = urlParams.get('convenio');

let state = {
    view: convenioIdDaUrl ? 'detalhes' : 'grid',
    activeConvenioId: convenioIdDaUrl ? parseInt(convenioIdDaUrl) : null,
    activeTab: 'medicos', 
    editingPerfil: null 
};

window.history.replaceState({ view: state.view, id: state.activeConvenioId }, '', window.location.search || '?view=grid');

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
    
    carregarDadosDaAPI();
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
    document.getElementById("stats-convenios").textContent = `${convenios.length} convênios registrados no sistema`;
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

function openConvenio(id) {
    state.activeConvenioId = id;
    state.activeTab = 'medicos';
    state.view = 'detalhes';
    window.history.pushState({ view: 'detalhes', id: id }, '', `?convenio=${id}`);
    renderApp();
}

function goBackToConvenios() {
    state.view = 'grid';
    state.activeConvenioId = null;
    window.history.pushState({ view: 'grid', id: null }, '', `?view=grid`);
    renderApp();
}

/* ─── Tela 2: Detalhes do Convênio (Hub Interno) ────────────── */
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
    showToast("Perfil atualizado visualmente (Demonstração).");
};

/* ─── Toasts e UX ───────────────────────────────────────────── */
function showToast(msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toast-msg").textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3500);
}

window.openModalAddConvenio = function() {
    alert("Nesta versão de demonstração, o fluxo principal de Arquitetura de Convênios já está mapeado no HTML/CSS. A criação seria idêntica ao modal de perfil.");
};

// --- Sistema de Logout (Para garantir que a porta está bem trancada) ---
const btnLogout = document.querySelector('.logout');

if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        window.location.replace('/static/login.html'); 
    });
}