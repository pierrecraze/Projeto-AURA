// --- Dados Base ---
const LOGS_RAW = [
    { id:1,  ts:"2026-05-23T14:32:01", usuario:"Admin", acao:"Login realizado com sucesso", ip:"187.22.10.45", cat:"ACESSO" },
    { id:2,  ts:"2026-05-23T14:35:18", usuario:"Dr. Carlos Mendes", acao:"Visualizou perfil do paciente #0007", ip:"200.18.32.91", cat:"INFO" },
    { id:3,  ts:"2026-05-23T14:41:55", usuario:"Dr. Carlos Mendes", acao:"Criou nova triagem — Paciente #0007", ip:"200.18.32.91", cat:"ACAO" },
    { id:4,  ts:"2026-05-23T14:50:02", usuario:"Sistema", acao:"Backup automático iniciado (2,4 GB)", ip:"10.0.0.1", cat:"SISTEMA" },
    { id:5,  ts:"2026-05-23T14:52:39", usuario:"Sistema", acao:"Backup concluído com sucesso", ip:"10.0.0.1", cat:"SISTEMA" },
    { id:6,  ts:"2026-05-23T15:01:14", usuario:"Desconhecido", acao:"Tentativa de login falha — CRM inválido", ip:"45.33.182.9", cat:"CRITICO" },
    { id:7,  ts:"2026-05-23T15:01:22", usuario:"Desconhecido", acao:"Tentativa de login falha — senha incorreta", ip:"45.33.182.9", cat:"CRITICO" },
    { id:8,  ts:"2026-05-23T15:01:30", usuario:"Desconhecido", acao:"IP bloqueado após 3 tentativas falhas", ip:"45.33.182.9", cat:"CRITICO" },
    { id:9,  ts:"2026-05-23T15:10:47", usuario:"Admin", acao:"Aprovou cadastro de Dra. Ana Carolina Costa", ip:"187.22.10.45", cat:"ACAO" },
    { id:10, ts:"2026-05-23T15:18:03", usuario:"Dra. Patrícia Andrade", acao:"Visualizou checklist SXF — Paciente #0002", ip:"177.44.19.120", cat:"INFO" },
    { id:11, ts:"2026-05-23T15:22:30", usuario:"Admin", acao:"Inativou perfil do paciente #0004", ip:"187.22.10.45", cat:"ALERTA" },
    { id:12, ts:"2026-05-23T15:35:11", usuario:"Dr. Rodrigo Figueiredo", acao:"Registrou resultado de triagem — Paciente #0003", ip:"200.155.7.88", cat:"ACAO" },
    { id:13, ts:"2026-05-23T15:40:00", usuario:"Sistema", acao:"Sessão expirada — Dr. Thiago Souza", ip:"10.0.0.1", cat:"SISTEMA" },
    { id:14, ts:"2026-05-23T15:47:29", usuario:"Dr. Thiago Souza", acao:"Re-login após expiração de sessão", ip:"191.33.44.200", cat:"ACESSO" },
    { id:15, ts:"2026-05-23T16:00:01", usuario:"Sistema", acao:"Rotina de limpeza de logs antigos executada", ip:"10.0.0.1", cat:"SISTEMA" },
    { id:16, ts:"2026-05-23T16:05:55", usuario:"Admin", acao:"Exportou relatório CSV de médicos", ip:"187.22.10.45", cat:"INFO" },
    { id:17, ts:"2026-05-23T16:10:14", usuario:"Dra. Camila Ribeiro", acao:"Atualizou dados de triagem — Paciente #0012", ip:"189.22.50.66", cat:"ACAO" },
    { id:18, ts:"2026-05-23T16:15:33", usuario:"Admin", acao:"Inativou médico: Dra. Mariana Rocha", ip:"187.22.10.45", cat:"ALERTA" },
    { id:19, ts:"2026-05-23T16:21:09", usuario:"Sistema", acao:"Verificação de integridade do banco executada", ip:"10.0.0.1", cat:"SISTEMA" },
    { id:20, ts:"2026-05-23T16:28:47", usuario:"Dr. Marcelo Cunha", acao:"Visualizou perfil do paciente #0011", ip:"201.76.33.14", cat:"INFO" },
    { id:21, ts:"2026-05-23T16:35:02", usuario:"Desconhecido", acao:"Tentativa de acesso à rota /admin/export sem autorização", ip:"92.17.4.230", cat:"CRITICO" },
    { id:22, ts:"2026-05-23T16:40:18", usuario:"Admin", acao:"Redefiniu permissões de acesso — Dr. Felipe Nascimento", ip:"187.22.10.45", cat:"ACAO" },
    { id:23, ts:"2026-05-23T16:55:44", usuario:"Sistema", acao:"Sincronização de índices do banco concluída", ip:"10.0.0.1", cat:"SISTEMA" },
    { id:24, ts:"2026-05-23T17:02:11", usuario:"Dra. Patrícia Andrade", acao:"Logout manual realizado", ip:"177.44.19.120", cat:"ACESSO" },
    { id:25, ts:"2026-05-23T17:10:58", usuario:"Dr. Felipe Nascimento", acao:"Criou nova triagem — Paciente #0017", ip:"201.55.88.32", cat:"ACAO" },
    { id:26, ts:"2026-05-23T17:18:03", usuario:"Admin", acao:"Visualizou log de auditoria completo", ip:"187.22.10.45", cat:"INFO" },
    { id:27, ts:"2026-05-23T17:25:30", usuario:"Sistema", acao:"Alerta: uso de CPU acima de 85% por 60s", ip:"10.0.0.1", cat:"ALERTA" },
    { id:28, ts:"2026-05-23T17:30:00", usuario:"Sistema", acao:"CPU normalizada — alerta encerrado", ip:"10.0.0.1", cat:"SISTEMA" },
    { id:29, ts:"2026-05-23T17:41:22", usuario:"Dr. Carlos Mendes", acao:"Logout manual realizado", ip:"200.18.32.91", cat:"ACESSO" },
    { id:30, ts:"2026-05-23T17:55:00", usuario:"Sistema", acao:"Relatório diário gerado e armazenado", ip:"10.0.0.1", cat:"SISTEMA" },
];

const CAT_LABELS = {
    CRITICO: "Crítico", ALERTA: "Alerta", ACESSO: "Acesso", 
    SISTEMA: "Sistema", ACAO: "Ação", INFO: "Info"
};

const CAT_ICONS = {
    CRITICO: "shield-alert", ALERTA: "alert-triangle", ACESSO: "lock",
    SISTEMA: "database", ACAO: "file-text", INFO: "info"
};

// --- Estado Global e History API ---
const urlParams = new URLSearchParams(window.location.search);

let state = {
    query: urlParams.get('q') || "",
    catFiltro: urlParams.get('cat') || "TODOS",
    dataIni: urlParams.get('inicio') || "",
    dataFim: urlParams.get('fim') || "",
    page: parseInt(urlParams.get('page')) || 1,
    perPage: 12
};

// Regista estado inicial
window.history.replaceState({ ...state }, '', window.location.search || '?logview=default');

// Deteta navegação do navegador (Botão Voltar)
window.addEventListener('popstate', (event) => {
    if (event.state) {
        state = { ...event.state };
        updateApp(false); // Atualiza sem fazer pushState de novo
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

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("pt-BR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    document.getElementById("current-date").textContent = today;

    // Sincroniza a interface com a URL caso a página seja acedida via link direto
    document.getElementById("search-input").value = state.query;
    document.getElementById("filter-date-ini").value = state.dataIni;
    document.getElementById("filter-date-fim").value = state.dataFim;
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.cat-btn[data-cat="${state.catFiltro}"]`);
    if(activeBtn) activeBtn.classList.add("active");

    renderKPIs();
    setupEventListeners();
    updateApp(false);
});

// --- Lógica de Renderização ---
function updateApp(pushState = true) {
    if(pushState) updateUrlState();

    // 1. Filtragem
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

    // 2. Ordenação Estática (Sempre por TS Descendente como default de log)
    lista.sort((a, b) => {
        if (a.ts < b.ts) return 1;
        if (a.ts > b.ts) return -1;
        return 0;
    });

    // 3. Paginação
    const totalPages = Math.ceil(lista.length / state.perPage);
    if (state.page > totalPages && totalPages > 0) state.page = totalPages;
    
    const start = (state.page - 1) * state.perPage;
    const slice = lista.slice(start, start + state.perPage);

    // 4. Atualizar DOM
    renderTable(slice);
    renderPagination(lista.length, totalPages);
    updateClearFiltersVisibility();
    
    document.getElementById("log-count-display").textContent = `${lista.length} entradas exibidas`;
    
    // IMPORTANTE: Recria os ícones Lucide da tela
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
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:56px 0; color:rgba(255,255,255,0.25);">// nenhum registo encontrado para os filtros selecionados</td></tr>`;
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
            <td><span style="color: ${acaoColor}; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${acaoText}</span></td>
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

// --- Helpers de Formatação ---
function fmtTs(isoString) {
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// --- Event Listeners ---
function setupEventListeners() {
    // Categorias
    document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            state.catFiltro = e.currentTarget.getAttribute("data-cat");
            state.page = 1;
            updateApp(true);
        });
    });

    // Datas
    document.getElementById("filter-date-ini").addEventListener("change", (e) => {
        state.dataIni = e.target.value; state.page = 1; updateApp(true);
    });
    document.getElementById("filter-date-fim").addEventListener("change", (e) => {
        state.dataFim = e.target.value; state.page = 1; updateApp(true);
    });

    // Busca
    document.getElementById("search-input").addEventListener("input", (e) => {
        state.query = e.target.value; state.page = 1; updateApp(true);
    });

    // Limpar Busca
    document.getElementById("clear-search").addEventListener("click", () => {
        state.query = ""; document.getElementById("search-input").value = "";
        state.page = 1; updateApp(true);
    });

    // Limpar Tudo
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

// Ação de Paginação no Escopo Global
window.changePage = function(newPage) {
    state.page = newPage;
    updateApp(true);
};