// --- Configuração da API ---
const API_URL = "http://localhost:8000/api";

// Array começa vazio e será preenchido pelo Python
let LOGS_RAW = [];

const CAT_LABELS = {
    CRITICO: "Crítico", ALERTA: "Alerta", ACESSO: "Acesso", 
    SISTEMA: "Sistema", ACAO: "Ação", INFO: "Info"
};

const CAT_ICONS = {
    CRITICO: "shield-alert", ALERTA: "alert-triangle", ACESSO: "lock",
    SISTEMA: "database", ACAO: "file-text", INFO: "info"
};

// --- Busca de Dados no Backend ---
async function carregarLogsDaAPI() {
    try {
        const token = localStorage.getItem('aura_token');

        const resposta = await fetch(`${API_URL}/logs/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        if (resposta.status === 401) {
            console.error('Sessão expirada. Chutando para o Login.');
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/static/login.html'); 
            return; 
        }

        const dbLogs = await resposta.json();

        // Traduzindo o padrão do Python para o visual do Front-end
        LOGS_RAW = dbLogs.map(log => {
            let categoria = "SISTEMA";
            if (log.acao === "Criação") categoria = "ACAO";
            else if (log.acao === "Atualização") categoria = "INFO";
            else if (log.acao === "Exclusão") categoria = "ALERTA";

            return {
                id: log.id,
                ts: log.data_hora,
                usuario: "Sistema", 
                entidade: log.entidade, 
                acao: `${log.acao} — ${log.detalhes}`, 
                ip: "127.0.0.1",
                cat: categoria
            };
        });

        console.log("Logs de auditoria sincronizados:", LOGS_RAW);
        
        renderKPIs();
        updateApp(false);

    } catch (erro) {
        console.error("Erro ao carregar logs do servidor:", erro);
    }
}

// --- Estado Global e History API ---
const urlParams = new URLSearchParams(window.location.search);

let state = {
    query: urlParams.get('q') || "",
    catFiltro: urlParams.get('cat') || "TODOS",
    dataIni: urlParams.get('inicio') || "",
    dataFim: urlParams.get('fim') || "",
    page: parseInt(urlParams.get('page')) || 1,
    perPage: 50
};

window.history.replaceState({ ...state }, '', window.location.search || '?logview=default');

window.addEventListener('popstate', (event) => {
    if (event.state) {
        state = { ...event.state };
        updateApp(false); 
    }
});

function updateUrlState() {
    const params = new URLSearchParams();
    if(state.query) params.set('q', state.query);
    if(state.catFiltro !== "TODOS") params.set('cat', state.catFiltro);
    if(state.dataIni) params.set('inicio', state.dataIni);
    if(state.dataFim) params.set('fim', state.dataFim);
    if(state.page > 1) params.set('page', state.page);
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.pushState({ ...state }, '', newUrl);
}

// --- Inicialização e Configuração UI ---
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("pt-BR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    document.getElementById("current-date").textContent = today;

    // Toggle da sidebar
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    const toggleIcon = document.getElementById("toggleIcon");
    let collapsed = false;
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            collapsed = !collapsed;
            sidebar.classList.toggle("collapsed", collapsed);
            toggleIcon.setAttribute("data-lucide", collapsed ? "panel-left-open" : "menu");
            lucide.createIcons();
        });
    }

    // Perfil do admin
    const user = JSON.parse(localStorage.getItem("aura_user") || "{}");
    const nome = user.nome || "Admin Principal";
    const iniciais = nome.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase() || "AD";

    ["profileName", "topbarName"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = nome; });
    ["profileAvatar", "topbarAvatar"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = iniciais; });

    document.getElementById("search-input").value = state.query;
    document.getElementById("filter-date-ini").value = state.dataIni;
    document.getElementById("filter-date-fim").value = state.dataFim;
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.cat-btn[data-cat="${state.catFiltro}"]`);
    if(activeBtn) activeBtn.classList.add("active");

    setupEventListeners();
    carregarLogsDaAPI();
    lucide.createIcons();
});

// --- Lógica de Renderização ---
function updateApp(pushState = true) {
    if(pushState) updateUrlState();

    let lista = [...LOGS_RAW];
    
    if (state.catFiltro !== "TODOS") {
        lista = lista.filter(e => e.cat === state.catFiltro);
    }
    if (state.dataIni) {
        lista = lista.filter(e => e.ts.slice(0, 10) >= state.dataIni);
    }
    if (state.dataFim) {
        lista = lista.filter(e => e.ts.slice(0, 10) <= state.dataFim);
    }
    if (state.query.trim()) {
        const q = state.query.toLowerCase();
        lista = lista.filter(e => 
            e.usuario.toLowerCase().includes(q) || 
            e.acao.toLowerCase().includes(q) || 
            e.ip.includes(q)
        );
    }

    lista.sort((a, b) => {
        if (a.ts < b.ts) return 1;
        if (a.ts > b.ts) return -1;
        return 0;
    });

    const totalPages = Math.ceil(lista.length / state.perPage);
    if (state.page > totalPages && totalPages > 0) state.page = totalPages;
    
    const start = (state.page - 1) * state.perPage;
    const slice = lista.slice(start, start + state.perPage);

    renderTable(slice);
    renderPagination(lista.length, totalPages);
    updateClearFiltersVisibility();
    
    document.getElementById("log-count-display").textContent = `${lista.length} entradas exibidas`;
    lucide.createIcons();
}

function renderKPIs() {
    const total = LOGS_RAW.length;
    const criticos = LOGS_RAW.filter(l => l.cat === "CRITICO").length;
    const alertas = LOGS_RAW.filter(l => l.cat === "ALERTA").length;
    const sistemas = LOGS_RAW.filter(l => l.cat === "SISTEMA").length;

    document.getElementById("kpi-total").textContent = total;
    document.getElementById("kpi-criticos").textContent = criticos;
    document.getElementById("kpi-alertas").textContent = alertas;
    document.getElementById("kpi-sistemas").textContent = sistemas;
}

function renderTable(slice) {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    if (slice.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:56px 0; color:rgba(255,255,255,0.25);">// nenhum registro encontrado para os filtros selecionados</td></tr>`;
        return;
    }

    slice.forEach(log => {
        const isCrit = log.cat === "CRITICO";
        const isAlrt = log.cat === "ALERTA";
        
        const rowClass = isCrit ? "row-critico" : isAlrt ? "row-alerta" : "row-normal";
        const tsColor = isCrit ? "#FCA5A5" : isAlrt ? "#FDE68A" : "rgba(255,255,255,0.6)";
        
        let userColor = "rgba(255,255,255,0.75)";
        let userText = log.usuario;
        let userWeight = 400;

        if (log.usuario === "Sistema") { userColor = "#7C3AED"; userText = "[ SISTEMA ]"; }
        else if (log.usuario === "Admin") { userColor = "#60A5FA"; }
        else if (log.usuario === "Desconhecido") { userColor = "#EF4444"; userText = "[ DESCONHECIDO ]"; userWeight = 700; }

        const acaoColor = isCrit ? "#FCA5A5" : isAlrt ? "#FDE68A" : "rgba(255,255,255,0.85)";
        const acaoText = isCrit ? `⚠ ${log.acao}` : log.acao;

        const ipColor = log.ip === "10.0.0.1" ? "rgba(124,58,237,0.8)" : isCrit ? "#FCA5A5" : "rgba(255,255,255,0.45)";

        const tr = document.createElement("tr");
        tr.className = rowClass;
        tr.innerHTML = `
            <td><span style="color: ${tsColor}; letter-spacing: 0.02em;">${fmtTs(log.ts)}</span></td>
            <td><span style="color: ${userColor}; font-weight: ${userWeight};">${userText}</span></td>
            
            <td><span style="color: #cbd5e1; font-weight: 500; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px;">${log.entidade}</span></td>
            
            <td title="${acaoText}" style="cursor: help;">
                <span style="color: ${acaoColor}; display:block; width: 100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${acaoText}</span>
            </td>
            
            <td><span style="color: ${ipColor}; background:rgba(255,255,255,0.04); padding:2px 7px; border-radius:4px;">${log.ip}</span></td>
            <td>
                <span class="badge-table badge-${log.cat}">
                    <i data-lucide="${CAT_ICONS[log.cat]}"></i> ${CAT_LABELS[log.cat]}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPagination(totalItems, totalPages) {
    const info = document.getElementById("pagination-info");
    const controls = document.getElementById("pagination-controls");
    
    const startNum = totalItems === 0 ? 0 : (state.page - 1) * state.perPage + 1;
    const endNum = Math.min(state.page * state.perPage, totalItems);
    info.textContent = `rows ${startNum}..${endNum} / ${totalItems}`;

    controls.innerHTML = "";
    
    controls.innerHTML += `<button class="btn-page" ${state.page === 1 ? 'disabled' : ''} onclick="changePage(${state.page - 1})"><i data-lucide="chevron-left"></i></button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        controls.innerHTML += `<button class="btn-page ${state.page === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    controls.innerHTML += `<button class="btn-page" ${state.page === totalPages || totalPages === 0 ? 'disabled' : ''} onclick="changePage(${state.page + 1})"><i data-lucide="chevron-right"></i></button>`;
}

function updateClearFiltersVisibility() {
    const btnClear = document.getElementById("clear-all-filters");
    const searchClear = document.getElementById("clear-search");
    
    const hasFilters = state.query || state.catFiltro !== "TODOS" || state.dataIni || state.dataFim;
    
    if (hasFilters) btnClear.classList.remove("hidden");
    else btnClear.classList.add("hidden");

    if (state.query) searchClear.classList.remove("hidden");
    else searchClear.classList.add("hidden");
}

function fmtTs(isoString) {
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function setupEventListeners() {
    document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            state.catFiltro = e.currentTarget.getAttribute("data-cat");
            state.page = 1;
            updateApp(true);
        });
    });

    document.getElementById("filter-date-ini").addEventListener("change", (e) => {
        state.dataIni = e.target.value; state.page = 1; updateApp(true);
    });
    document.getElementById("filter-date-fim").addEventListener("change", (e) => {
        state.dataFim = e.target.value; state.page = 1; updateApp(true);
    });

    document.getElementById("search-input").addEventListener("input", (e) => {
        state.query = e.target.value; state.page = 1; updateApp(true);
    });

    document.getElementById("clear-search").addEventListener("click", () => {
        state.query = ""; document.getElementById("search-input").value = "";
        state.page = 1; updateApp(true);
    });

    document.getElementById("clear-all-filters").addEventListener("click", () => {
        state.query = ""; state.catFiltro = "TODOS"; state.dataIni = ""; state.dataFim = "";
        document.getElementById("search-input").value = "";
        document.getElementById("filter-date-ini").value = "";
        document.getElementById("filter-date-fim").value = "";
        document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
        document.querySelector('.cat-btn[data-cat="TODOS"]').classList.add("active");
        state.page = 1; updateApp(true);
    });
}

window.changePage = function(newPage) {
    state.page = newPage;
    updateApp(true);
};

// --- Logout ---
const btnLogout = document.querySelector('.logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        window.location.replace('/static/login.html'); 
    });
}