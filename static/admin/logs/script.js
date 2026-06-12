// --- Configuração da API ---
const API_URL = "/api";

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
            window.location.replace('/login.html'); 
            return; 
        }

        const dbLogs = await resposta.json();

        // Traduzindo o padrão do Python para o visual do Front-end
        LOGS_RAW = dbLogs.map(log => {
            let categoria = "SISTEMA";
            if (log.acao_realizada === "Criação") categoria = "ACAO";
            else if (log.acao_realizada === "Atualização") categoria = "INFO";
            else if (log.acao_realizada === "Inativação" || log.acao_realizada === "Exclusão") categoria = "ALERTA";

            return {
                id: log.id,
                ts: log.data_hora,
                usuario: log.ator_nome || (log.tipo_ator === "admin_sistema" ? "Admin" : "Sistema"), 
                entidade: log.tabela_afetada || "Desconhecida", 
                acao: `${log.acao_realizada} — ${log.detalhe}`, 
                ip: log.ip_origem || "127.0.0.1",
                cat: categoria,
                tipo_ator: log.tipo_ator
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
    atorFiltro: urlParams.get('ator') || "TODOS",
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
    if(state.atorFiltro !== "TODOS") params.set('ator', state.atorFiltro);
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
    const cargo = user.cargo || "Administrador";
    const email = user.email || "admin@instituto.org";
    const iniciais = nome.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase() || "AD";

    ["profileName", "topbarName"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = nome; });
    ["profileAvatar", "topbarAvatar"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = iniciais; });
    document.querySelectorAll('.profile-role').forEach(el => el.textContent = `${cargo} · IBK`);

    // Povoando e ativando o Popup de Perfil
    const popupName = document.getElementById("popupName");
    const popupEmail = document.getElementById("popupEmail");
    const popupRole = document.getElementById("popupRole");
    if (popupName) popupName.textContent = nome;
    if (popupEmail) popupEmail.textContent = email;
    if (popupRole) popupRole.textContent = cargo;

    const profileCard = document.getElementById("profileCard");
    const profilePopup = document.getElementById("profilePopup");
    if (profileCard && profilePopup) {
        profileCard.addEventListener("click", (e) => {
            e.stopPropagation();
            profilePopup.classList.toggle("show");
            lucide.createIcons();
        });
        document.addEventListener("click", (e) => {
            if (!profilePopup.contains(e.target)) {
                profilePopup.classList.remove("show");
            }
        });
    }

    const btnLogout = document.getElementById('popupLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/login.html');
        });
    }

    document.getElementById("search-input").value = state.query;
    document.getElementById("filter-date-ini").value = state.dataIni;
    document.getElementById("filter-date-fim").value = state.dataFim;
    
    document.querySelectorAll(".ator-pill").forEach(b => b.classList.remove("active"));
    const activeAtor = document.querySelector(`.ator-pill[data-ator="${state.atorFiltro}"]`);
    if (activeAtor) activeAtor.classList.add("active");

    document.querySelectorAll(".kpi-card").forEach(b => b.classList.remove("active"));
    const activeKpi = document.querySelector(`.kpi-card[onclick*="${state.catFiltro}"]`);
    if(activeKpi) activeKpi.classList.add("active");

    setupEventListeners();
    carregarLogsDaAPI();
    lucide.createIcons();
});

// --- Lógica de Renderização ---
function getFilteredLogs() {
    let lista = [...LOGS_RAW];
    
    if (state.catFiltro !== "TODOS") {
        lista = lista.filter(e => e.cat === state.catFiltro);
    }
    if (state.atorFiltro !== "TODOS") {
        lista = lista.filter(e => e.tipo_ator === state.atorFiltro);
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

    return lista;
}

function updateApp(pushState = true) {
    if(pushState) updateUrlState();

    let lista = getFilteredLogs();

    // Pinta o botão correto no momento em que a página é atualizada ou acessada por atalho
    document.querySelectorAll(".ator-pill").forEach(b => {
        b.classList.toggle("active", b.dataset.ator === state.atorFiltro);
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
        let userIcon = "user";

        if (log.usuario === "Sistema") { userColor = "#7C3AED"; userText = "[ SISTEMA ]"; userIcon = "cpu"; }
        else if (log.tipo_ator === "admin_sistema") { userColor = "#60A5FA"; userIcon = "shield-check"; }
        else if (log.tipo_ator === "medico") { userColor = "#10B981"; userIcon = "stethoscope"; }
        else if (log.usuario === "Desconhecido") { userColor = "#EF4444"; userText = "[ DESCONHECIDO ]"; userWeight = 700; userIcon = "help-circle"; }

        const acaoColor = isCrit ? "#FCA5A5" : isAlrt ? "#FDE68A" : "rgba(255,255,255,0.85)";
        const acaoText = isCrit ? `⚠ ${log.acao}` : log.acao;

        const ipColor = log.ip === "10.0.0.1" ? "rgba(124,58,237,0.8)" : isCrit ? "#FCA5A5" : "rgba(255,255,255,0.45)";

        const tr = document.createElement("tr");
        tr.className = rowClass;
        tr.innerHTML = `
            <td><span style="color: ${tsColor}; letter-spacing: 0.02em;">${fmtTs(log.ts)}</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="${userIcon}" style="width: 14px; height: 14px; color: ${userColor}; opacity: 0.8;"></i>
                    <span style="color: ${userColor}; font-weight: ${userWeight};">${userText}</span>
                </div>
            </td>
            
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

window.setKpiFilter = function(cat, el) {
    state.catFiltro = cat;
    document.querySelectorAll('.kpi-card').forEach(k => k.classList.remove('active'));
    if(el) el.classList.add('active');
    
    state.page = 1;
    updateApp(true);
};

function updateClearFiltersVisibility() {
    const btnClear = document.getElementById("clear-all-filters");
    const searchClear = document.getElementById("clear-search");
    
    const hasFilters = state.query || state.catFiltro !== "TODOS" || state.dataIni || state.dataFim || state.atorFiltro !== "TODOS";
    
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

function getDataHoraAtual() {
    const now = new Date();
    return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
}

// --- Lógica de Exportação ---
function exportToCSV() {
    const logsParaExportar = getFilteredLogs();
    const header = ["Data/Hora", "Usuario", "Entidade", "Acao", "Endereco IP", "Categoria"];
    const rows = logsParaExportar.map(log => [
        fmtTs(log.ts), log.usuario, log.entidade, log.acao, log.ip, CAT_LABELS[log.cat]
    ]);
    const dataHora = getDataHoraAtual();
    const metadata = `"Relatório de Auditoria de Logs - Instituto Buko Kaesemodel"\n"Baixado em: ${dataHora}"\n\n`;
    const csvContent = metadata + [header, ...rows].map(e => e.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `aura_logs_auditoria_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Erro: Biblioteca geradora de PDF não carregada. Tente recarregar a página.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(14);
    doc.text("Relatório de Auditoria de Logs - IBK / AURA", 14, 15);
    const dataHora = getDataHoraAtual();
    doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    doc.text(`Baixado em: ${dataHora}`, 14, 22);
    
    const logsParaExportar = getFilteredLogs();
    const rows = logsParaExportar.map(log => [
        fmtTs(log.ts), log.usuario, log.entidade, log.acao, log.ip, CAT_LABELS[log.cat]
    ]);
    
    doc.autoTable({
        head: [["Data/Hora", "Usuario", "Entidade", "Ação", "Endereço IP", "Categoria"]],
        body: rows,
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [13, 27, 53] } // Azul escuro do AURA
    });
    
    doc.save(`aura_logs_auditoria_${new Date().getTime()}.pdf`);
}

function setupExportModal() {
    const btnModal = document.getElementById("btnExportModal");
    const overlay = document.getElementById("modalExportOverlay");
    if (!btnModal || !overlay) return;
    let fmt = 'pdf';
    function fechar() { overlay.style.display = "none"; document.body.style.overflow = ""; }
    function preview() {
        const fLogs = getFilteredLogs();
        const am = fLogs.slice(0, 5);
        const area = document.getElementById("exportLivePreview");
        if (fmt === 'pdf') {
            area.className = "export-live-preview";
            let html = `<div class="preview-doc-title">Relatório de Auditoria de Logs</div><div style="text-align:center; font-size:10px; color:#64748B; margin-bottom: 14px; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px;">Baixado em: ${getDataHoraAtual()}</div>`;
            html += `<table class="preview-doc-table"><thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th></tr></thead><tbody>`;
            if (am.length === 0) html += `<tr><td colspan="3" style="text-align:center; color:#94A3B8;">Nenhum dado</td></tr>`;
            else { am.forEach(l => { html += `<tr><td>${fmtTs(l.ts)}</td><td>${l.usuario}</td><td>${l.acao}</td></tr>`; });
            if (fLogs.length > 5) html += `<tr><td colspan="3" style="text-align:center; color:#94A3B8;">... e mais ${fLogs.length - 5} logs</td></tr>`; }
            area.innerHTML = html + `</tbody></table>`;
        } else {
            area.className = "export-live-preview csv-mode";
            let txt = `"Relatório de Auditoria de Logs - IBK"\n"Baixado em: ${getDataHoraAtual()}"\n\nData/Hora,Usuario,Entidade,Acao\n`;
            am.forEach(l => { txt += `"${fmtTs(l.ts)}","${l.usuario}","${l.entidade}","${l.acao}"\n`; });
            area.textContent = txt;
        }
    }
    btnModal.addEventListener("click", () => { overlay.style.display = "flex"; document.body.style.overflow = "hidden"; preview(); });
    [document.getElementById("modalExportClose"), document.getElementById("btnExportCancel")].forEach(b => b.addEventListener("click", fechar));
    overlay.addEventListener("click", e => { if (e.target === overlay) fechar(); });
    ['pdf', 'csv'].forEach(f => { document.getElementById(`format${f.charAt(0).toUpperCase() + f.slice(1)}`).addEventListener("click", () => { fmt = f; document.getElementById("formatPdf").classList.toggle("active", f === 'pdf'); document.getElementById("formatCsv").classList.toggle("active", f === 'csv'); preview(); }); });
    document.getElementById("btnExportConfirm").addEventListener("click", () => { fechar(); if (fmt === 'csv') exportToCSV(); else exportToPDF(); });
}

function setupEventListeners() {
    setupExportModal();

    document.getElementById("clear-all-filters").addEventListener("click", () => {
        state.query = ""; state.catFiltro = "TODOS"; state.atorFiltro = "TODOS";
        state.dataIni = ""; state.dataFim = ""; state.page = 1; updateApp(true);
    });

    document.getElementById("clear-search").addEventListener("click", () => {
        state.query = ""; state.page = 1; updateApp(true);
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

    document.querySelectorAll(".ator-pill").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const clickedAtor = e.currentTarget.dataset.ator;
            // Funciona como Toggle: se já estava selecionado, ele desmarca e seleciona "TODOS"
            if (state.atorFiltro === clickedAtor) {
                state.atorFiltro = "TODOS";
            } else {
                state.atorFiltro = clickedAtor;
            }
            state.page = 1;
            updateApp(true);
        });
    });
}