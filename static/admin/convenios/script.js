// ==========================================
// AURA — Gestão de Convênios (Grupos)
// ==========================================

const API_URL = "/api/grupos/";
let conveniosData = [];
let activeConvenio = null;
let editId = null;
let currentFilter = 'Todos';
let conveniosFiltrados = [];

document.addEventListener("DOMContentLoaded", () => {
    setupDate();
    setupSidebar();
    setupProfile();
    setupNotificacoes();
    setupCnpjMask();
    carregarConvenios();
});

// ==========================================
// 1. CARGA DE DADOS (API)
// ==========================================
async function carregarConvenios() {
    try {
        const token = localStorage.getItem('aura_token');
        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/login.html');
            return;
        }

        if (res.ok) {
            conveniosData = await res.json();
            renderConvenios();
            updateStats();
        } else {
            showToast("Erro ao buscar convênios da API.", "error");
        }
    } catch (err) {
        console.error("Erro na API:", err);
        showToast("Erro de conexão com o servidor.", "error");
    }
}

// ==========================================
// 2. RENDERIZAÇÃO DO GRID PRINCIPAL
// ==========================================
function renderConvenios() {
    const grid = document.getElementById("convenios-grid");
    grid.innerHTML = "";

    let filteredData = conveniosData;
    
    // Filtro atualizado para usar o 'deletado_em' do banco de dados
    if (currentFilter === 'Ativos') {
        filteredData = conveniosData.filter(c => c.deletado_em === null);
    } else if (currentFilter === 'Inativos') {
        filteredData = conveniosData.filter(c => c.deletado_em !== null);
    }
    conveniosFiltrados = filteredData;

    if (filteredData.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="building-2"></i>
                <p>Nenhum convênio ou operadora encontrado${currentFilter !== 'Todos' ? ' para este filtro' : ''}.</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    filteredData.forEach((conv) => {
        // Tradução do campo deletado_em para o status visual
        const statusAtual = conv.deletado_em ? "Inativo" : "Ativo";
        
        const cor = conv.cor || '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        const corDestaque = `background: ${cor};`;
        const corIcone = `color: ${cor}; background: ${cor}22;`;
        
        const logoHtml = `<i data-lucide="building-2"></i>`;

        const numMedicos = conv.medicos ? conv.medicos.length : 0;
        const numPacientes = conv.pacientes ? conv.pacientes.length : 0;

        const card = document.createElement("div");
        card.className = "convenio-card";
        card.onclick = () => openConvenioDetails(conv.id);

        card.innerHTML = `
            <div class="cv-stripe" style="${corDestaque}"></div>
            <div class="cv-body">
                <div class="cv-top">
                    <div class="cv-icon-wrap" style="${corIcone}">
                        ${logoHtml}
                    </div>
                    <div class="status-badge ${statusAtual.toLowerCase()}">
                        <div class="dot"></div> ${statusAtual}
                    </div>
                </div>
                <h3 class="cv-title">${conv.nome_fantasia}</h3>
                <p class="cv-cnpj">${applyCnpjMask(conv.cnpj) || 'CNPJ não informado'}</p>
                <div class="cv-stats">
                    <div class="cv-stat">
                        <span class="cv-stat-val">${numMedicos}</span>
                        <span class="cv-stat-label">Médicos</span>
                    </div>
                    <div class="cv-stat">
                        <span class="cv-stat-val">${numPacientes}</span>
                        <span class="cv-stat-label">Pacientes</span>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    lucide.createIcons();
}

function updateStats() {
    // Estatísticas calculadas baseadas no 'deletado_em'
    const ativos = conveniosData.filter(c => c.deletado_em === null).length;
    const inativos = conveniosData.filter(c => c.deletado_em !== null).length;
    document.getElementById("stats-convenios").textContent = `${conveniosData.length} convênio(s) cadastrado(s)`;
    
    const statsBar = document.getElementById("stats-bar");
    if (statsBar) {
        statsBar.innerHTML = `
            <div class="stat-chip" onclick="setFilter('Todos')" style="cursor: pointer; transition: all 0.2s ease; ${currentFilter === 'Todos' ? 'outline: 2px solid #3B82F6; outline-offset: -1px;' : ''}">
                <div class="stat-chip-icon" style="background:#EFF6FF;color:#1D4ED8;"><i data-lucide="building-2"></i></div>
                <div>
                    <div class="stat-chip-val">${conveniosData.length}</div>
                    <div class="stat-chip-label">Total Cadastrados</div>
                </div>
            </div>
            <div class="stat-chip" onclick="setFilter('Ativos')" style="cursor: pointer; transition: all 0.2s ease; ${currentFilter === 'Ativos' ? 'outline: 2px solid #15803D; outline-offset: -1px;' : ''}">
                <div class="stat-chip-icon" style="background:#F0FDF4;color:#15803D;"><i data-lucide="check-circle"></i></div>
                <div>
                    <div class="stat-chip-val">${ativos}</div>
                    <div class="stat-chip-label">Convênios Ativos</div>
                </div>
            </div>
            <div class="stat-chip" onclick="setFilter('Inativos')" style="cursor: pointer; transition: all 0.2s ease; ${currentFilter === 'Inativos' ? 'outline: 2px solid #DC2626; outline-offset: -1px;' : ''}">
                <div class="stat-chip-icon" style="background:#FEF2F2;color:#DC2626;"><i data-lucide="x-circle"></i></div>
                <div>
                    <div class="stat-chip-val">${inativos}</div>
                    <div class="stat-chip-label">Convênios Inativos</div>
                </div>
            </div>
        `;
    }
    lucide.createIcons();
}

function setFilter(filter) {
    currentFilter = filter;
    renderConvenios();
    updateStats(); 
}

// ==========================================
// 3. VIEW DE DETALHES DO CONVÊNIO
// ==========================================
function openConvenioDetails(id) {
    activeConvenio = conveniosData.find(c => c.id === id);
    if (!activeConvenio) return;

    document.getElementById("view-convenios").classList.add("hidden");
    document.getElementById("view-detalhes").classList.remove("hidden");

    document.getElementById("detalhe-nome-convenio").textContent = activeConvenio.nome_fantasia;
    document.getElementById("detalhe-titulo").textContent = activeConvenio.nome_fantasia;
    document.getElementById("detalhe-cnpj").textContent = applyCnpjMask(activeConvenio.cnpj) || "00.000.000/0000-00";

    const btnToggleStatus = document.getElementById("btn-toggle-status");
    if (btnToggleStatus) {
        if (activeConvenio.deletado_em !== null) {
            btnToggleStatus.innerHTML = `<i data-lucide="check-circle"></i> Reativar`;
            btnToggleStatus.style.cssText = "color: #15803D; border-color: #BBF7D0; background: #F0FDF4;";
        } else {
            btnToggleStatus.innerHTML = `<i data-lucide="trash-2"></i> Desativar`;
            btnToggleStatus.style.cssText = "color: #DC2626; border-color: #FECACA; background: #FEF2F2;";
        }
    }

    document.getElementById("hero-count-medicos").textContent = activeConvenio.medicos ? activeConvenio.medicos.length : 0;
    document.getElementById("hero-count-pacientes").textContent = activeConvenio.pacientes ? activeConvenio.pacientes.length : 0;

    switchTab('medicos');
    window.scrollTo(0, 0);
    lucide.createIcons();
}

function goBackToConvenios() {
    document.getElementById("view-convenios").classList.remove("hidden");
    document.getElementById("view-detalhes").classList.add("hidden");
    activeConvenio = null;
}

function switchTab(tabName) {
    document.getElementById("tab-medicos").classList.toggle("active", tabName === "medicos");
    document.getElementById("tab-pacientes").classList.toggle("active", tabName === "pacientes");

    const thead = document.getElementById("dynamic-thead");
    const tbody = document.getElementById("dynamic-tbody");

    if (tabName === "medicos") {
        thead.innerHTML = `<tr><th>Médico</th><th>CRM</th><th>Status</th><th style="text-align:right">Ações</th></tr>`;
        if (activeConvenio && activeConvenio.medicos && activeConvenio.medicos.length > 0) {
            tbody.innerHTML = activeConvenio.medicos.map(m => `<tr><td>${m.nome}</td><td>${m.crm || '-'}</td><td>${m.status || 'Ativo'}</td><td style="text-align:right">-</td></tr>`).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:#94A3B8;">Nenhum médico vinculado até o momento.</td></tr>`;
        }
    } else {
        thead.innerHTML = `<tr><th>Paciente</th><th>CPF</th><th>Status</th><th style="text-align:right">Ações</th></tr>`;
        if (activeConvenio && activeConvenio.pacientes && activeConvenio.pacientes.length > 0) {
            tbody.innerHTML = activeConvenio.pacientes.map(p => `<tr><td>${p.nome}</td><td>${p.cpf || '-'}</td><td>${p.status || 'Ativo'}</td><td style="text-align:right">-</td></tr>`).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:#94A3B8;">Nenhum paciente vinculado até o momento.</td></tr>`;
        }
    }
}

// ==========================================
// EXPORTAÇÃO E MODAL DE PREVIEW
// ==========================================
function getDataHoraAtual() {
    const now = new Date(); return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
}

function exportarCSV() {
    const header = ["ID", "Nome Fantasia", "CNPJ", "Status"];
    const rows = conveniosFiltrados.map(c => [c.id, c.nome_fantasia, applyCnpjMask(c.cnpj) || c.cnpj, c.deletado_em ? "Inativo" : "Ativo"]);
    const metadata = `"Relatório de Convênios - Instituto Buko Kaesemodel"\n"Baixado em: ${getDataHoraAtual()}"\n\n`;
    const csv = metadata + [header, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `convenios_aura_${new Date().getTime()}.csv`; a.click();
    URL.revokeObjectURL(url);
}

function exportarPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) return showToast("Erro: Biblioteca PDF não carregada.", "error");
    const { jsPDF } = window.jspdf; const doc = new jsPDF('portrait');
    doc.setFontSize(14); doc.text("Relatório de Convênios - Instituto Buko Kaesemodel", 14, 15);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Baixado em: ${getDataHoraAtual()}`, 14, 22);
    const rows = conveniosFiltrados.map(c => [c.id, c.nome_fantasia, applyCnpjMask(c.cnpj) || c.cnpj, c.deletado_em ? "Inativo" : "Ativo"]);
    doc.autoTable({ head: [["ID", "Nome Fantasia", "CNPJ", "Status"]], body: rows, startY: 28, styles: { fontSize: 9 }, headStyles: { fillColor: [13, 27, 53] } });
    doc.save(`convenios_aura_${new Date().getTime()}.pdf`);
}

function setupExportModal() {
    const btnModal = document.getElementById("btnExportModal");
    const overlay = document.getElementById("modalExportOverlay");
    if (!btnModal || !overlay) return;
    let fmt = 'pdf';
    function fechar() { overlay.style.display = "none"; document.body.style.overflow = ""; }
    function preview() {
        const am = conveniosFiltrados.slice(0, 5);
        const area = document.getElementById("exportLivePreview");
        if (fmt === 'pdf') {
            area.className = "export-live-preview";
            let html = `<div class="preview-doc-title">Relatório de Convênios</div><div style="text-align:center; font-size:10px; color:#64748B; margin-bottom: 14px; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px;">Baixado em: ${getDataHoraAtual()}</div>`;
            html += `<table class="preview-doc-table"><thead><tr><th>ID</th><th>Nome</th><th>CNPJ</th><th>Status</th></tr></thead><tbody>`;
            if (am.length === 0) html += `<tr><td colspan="4" style="text-align:center; color:#94A3B8;">Nenhum dado</td></tr>`;
            else { am.forEach(c => { html += `<tr><td>#${c.id}</td><td>${c.nome_fantasia}</td><td>${applyCnpjMask(c.cnpj)}</td><td>${c.deletado_em ? "Inativo" : "Ativo"}</td></tr>`; });
            if (conveniosFiltrados.length > 5) html += `<tr><td colspan="4" style="text-align:center; color:#94A3B8;">... e mais ${conveniosFiltrados.length - 5} convênios</td></tr>`; }
            area.innerHTML = html + `</tbody></table>`;
        } else {
            area.className = "export-live-preview csv-mode";
            let txt = `"Relatório de Convênios - IBK"\n"Baixado em: ${getDataHoraAtual()}"\n\nID,Nome Fantasia,CNPJ,Status\n`;
            am.forEach(c => { txt += `"${c.id}","${c.nome_fantasia}","${applyCnpjMask(c.cnpj)}","${c.deletado_em ? "Inativo" : "Ativo"}"\n`; });
            area.textContent = txt;
        }
    }
    btnModal.addEventListener("click", () => { overlay.style.display = "flex"; document.body.style.overflow = "hidden"; preview(); });
    [document.getElementById("modalExportClose"), document.getElementById("btnExportCancel")].forEach(b => b.addEventListener("click", fechar));
    overlay.addEventListener("click", e => { if (e.target === overlay) fechar(); });
    ['pdf', 'csv'].forEach(f => { document.getElementById(`format${f.charAt(0).toUpperCase() + f.slice(1)}`).addEventListener("click", () => { fmt = f; document.getElementById("formatPdf").classList.toggle("active", f === 'pdf'); document.getElementById("formatCsv").classList.toggle("active", f === 'csv'); preview(); }); });
    document.getElementById("btnExportConfirm").addEventListener("click", () => { fechar(); if (fmt === 'csv') { showToast("Baixando CSV..."); exportarCSV(); } else { showToast("Gerando PDF..."); exportarPDF(); } });
}
document.addEventListener("DOMContentLoaded", setupExportModal);
// ==========================================
// 4. MODAL NOVO/EDITAR CONVÊNIO
// ==========================================
function openModalAddConvenio() {
    editId = null;
    document.getElementById("modal-convenio-title").textContent = "Novo Convênio";
    document.getElementById("convenio-nome").value = "";
    document.getElementById("convenio-cnpj").value = "";
    document.getElementById("convenio-status").value = "Ativo";
    
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    document.getElementById("convenio-cor").value = randomColor;
    const hexSpan = document.getElementById("convenio-cor-hex");
    if (hexSpan) hexSpan.textContent = randomColor;

    document.getElementById("modal-convenio").classList.remove("hidden");
}

function openModalEditConvenio(id) {
    activeConvenio = conveniosData.find(c => c.id === id);
    if (!activeConvenio) return;
    
    editId = id;
    document.getElementById("modal-convenio-title").textContent = "Editar Convênio";
    document.getElementById("convenio-nome").value = activeConvenio.nome_fantasia;
    document.getElementById("convenio-cnpj").value = applyCnpjMask(activeConvenio.cnpj || "");
    document.getElementById("convenio-status").value = activeConvenio.deletado_em !== null ? "Inativo" : "Ativo";
    
    const cor = activeConvenio.cor || '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    document.getElementById("convenio-cor").value = cor;
    const hexSpan = document.getElementById("convenio-cor-hex");
    if (hexSpan) hexSpan.textContent = cor;
    
    document.getElementById("modal-convenio").classList.remove("hidden");
}

function closeModalConvenio() {
    document.getElementById("modal-convenio").classList.add("hidden");
}

async function saveConvenio() {
    const nomeFantasia = document.getElementById("convenio-nome").value.trim();
    const cnpjInput = document.getElementById("convenio-cnpj").value.trim();
    const cnpj = cnpjInput.replace(/\D/g, ""); // Remove a máscara antes de enviar pra API
    const cor = document.getElementById("convenio-cor").value;

    if (!nomeFantasia) {
        showToast("O nome do convênio é obrigatório.", "error");
        return;
    }
    
    if (!cnpj) {
        showToast("O CNPJ é obrigatório.", "error");
        return;
    }

    if (cnpj.length !== 14) {
        showToast("O CNPJ deve conter 14 dígitos.", "error");
        return;
    }

    const payload = { 
        nome_fantasia: nomeFantasia, 
        cnpj: cnpj,
        cor: cor
    };

    try {
        const token = localStorage.getItem("aura_token");
        const url = editId ? `${API_URL}${editId}` : API_URL;
        const method = editId ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast(`Convênio salvo com sucesso!`, "success");
            closeModalConvenio();
            carregarConvenios();
        } else {
            showToast("Erro ao salvar o convênio.", "error");
        }
    } catch (err) {
        showToast("Erro de conexão.", "error");
    }
}

// ==========================================
// 5. AÇÕES DE DETALHES DO CONVÊNIO
// ==========================================
function editarConvenioAtual() {
    if (activeConvenio) {
        openModalEditConvenio(activeConvenio.id);
    }
}

async function toggleStatusConvenioAtual() {
    if (!activeConvenio) return;
    
    const isAtivo = activeConvenio.deletado_em === null;
    const acao = isAtivo ? "desativar" : "reativar";
    
    // Alinha com os endpoints padrões de inativar/reativar do backend
    const method = isAtivo ? "DELETE" : "PATCH";
    const url = isAtivo ? `${API_URL}${activeConvenio.id}` : `${API_URL}${activeConvenio.id}/reativar`;

    if (!confirm(`Deseja realmente ${acao} o convênio ${activeConvenio.nome_fantasia}?`)) return;

    try {
        const token = localStorage.getItem("aura_token");
        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast(`Convênio ${isAtivo ? 'desativado' : 'reativado'} com sucesso.`, "success");
            goBackToConvenios();
            carregarConvenios();
        } else {
            showToast(`Erro ao ${acao} o convênio.`, "error");
        }
    } catch (err) {
        console.error(`Erro ao ${acao} convênio:`, err);
        showToast("Erro de conexão.", "error");
    }
}

// ==========================================
// 6. COMPONENTES GLOBAIS E UI
// ==========================================
function setupDate() {
    const dateEl = document.getElementById("current-date");
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    }
}

function setupSidebar() {
    const btn = document.getElementById("sidebarToggle");
    if (btn) {
        btn.addEventListener("click", () => {
            document.getElementById("sidebar").classList.toggle("collapsed");
        });
    }
}

function setupProfile() {
    const user = JSON.parse(localStorage.getItem("aura_user") || "{}");
    const nomeFull = user.nome || "Admin Principal";
    const cargo = user.cargo || "Administrador";
    const nameParts = nomeFull.trim().split(" ");
    const nomeExibicao = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : nomeFull;
    const iniciais = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase() : nomeFull.substring(0, 2).toUpperCase() || "AD";

    ["profileName", "topbarName"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = nomeExibicao;
    });
    ["profileAvatar", "topbarAvatar"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = iniciais;
    });
    document.querySelectorAll('.profile-role').forEach(el => el.textContent = `${cargo} · IBK`);
    
    const btnLogout = document.querySelector('.logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/login.html');
        });
    }
}

function setupNotificacoes() {
    const notifBtn = document.getElementById("notifBtn");
    const notifPanel = document.getElementById("notifPanel");
    if (notifBtn && notifPanel) {
        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            notifPanel.classList.toggle("open");
        });
        document.addEventListener("click", (e) => {
            if (!notifPanel.contains(e.target)) {
                notifPanel.classList.remove("open");
            }
        });
    }
}

function setupCnpjMask() {
    const cnpjInput = document.getElementById("convenio-cnpj");
    if (cnpjInput) {
        cnpjInput.addEventListener("input", function (e) {
            e.target.value = applyCnpjMask(e.target.value);
        });
        
        // Adiciona dinamicamente o asterisco vermelho ao label do CNPJ
        const cnpjLabel = document.querySelector('label[for="convenio-cnpj"]');
        if (cnpjLabel && !cnpjLabel.innerHTML.includes('*')) {
            cnpjLabel.innerHTML += ' <span style="color: #DC2626;">*</span>';
        }
    }
}

function applyCnpjMask(value) {
    if (!value) return "";
    let v = value.replace(/\D/g, ""); // Mantém apenas números
    if (v.length > 14) v = v.substring(0, 14);
    
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    return v;
}

function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    const msgEl = document.getElementById("toast-msg");
    const icon = document.getElementById("toast-icon");
    
    toast.className = `toast ${type}`;
    msgEl.textContent = msg;
    
    if (type === "success") {
        icon.setAttribute("data-lucide", "check-circle");
        toast.style.background = "";
        toast.style.color = "";
        toast.style.borderColor = "";
    } else {
        icon.setAttribute("data-lucide", "alert-circle");
        toast.style.background = "#FEF2F2";
        toast.style.color = "#DC2626";
        toast.style.borderColor = "#FECACA";
    }
    
    toast.classList.remove("hidden");
    lucide.createIcons();
    setTimeout(() => toast.classList.add("hidden"), 3500);
}