// ==========================================
// AURA — Gestão de Convênios (Grupos)
// ==========================================

const API_URL = "http://localhost:8000/api/grupos/";
let conveniosData = [];
let activeConvenio = null;
let editId = null;

document.addEventListener("DOMContentLoaded", () => {
    setupDate();
    setupSidebar();
    setupProfile();
    setupNotificacoes();
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
            window.location.replace('/static/login.html');
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

    if (conveniosData.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="building-2"></i>
                <p>Nenhum convênio ou operadora cadastrado.</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    conveniosData.forEach((conv, idx) => {
        // Fallback de cor caso o convênio não tenha cor cadastrada
        const stripeClass = `stripe-${(idx % 6) + 1}`;
        
        const corDestaque = conv.cor ? `background: ${conv.cor};` : '';
        const corIcone = conv.cor ? `color: ${conv.cor}; background: ${conv.cor}22;` : '';
        const logoHtml = conv.logo 
            ? `<img src="${conv.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`
            : `<i data-lucide="building-2"></i>`;

        const card = document.createElement("div");
        card.className = "convenio-card";
        card.onclick = () => openConvenioDetails(conv.id);

        card.innerHTML = `
            <div class="cv-stripe ${conv.cor ? '' : stripeClass}" style="${corDestaque}"></div>
            <div class="cv-body">
                <div class="cv-top">
                    <div class="cv-icon-wrap" style="${corIcone}">
                        ${logoHtml}
                    </div>
                    <div class="status-badge ${conv.status.toLowerCase()}">
                        <div class="dot"></div> ${conv.status}
                    </div>
                </div>
                <h3 class="cv-title">${conv.nome}</h3>
                <p class="cv-cnpj">${conv.cnpj || 'CNPJ não informado'}</p>
                <div class="cv-stats">
                    <div class="cv-stat">
                        <span class="cv-stat-val">—</span>
                        <span class="cv-stat-label">Médicos</span>
                    </div>
                    <div class="cv-stat">
                        <span class="cv-stat-val">—</span>
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
    const ativos = conveniosData.filter(c => c.status === "Ativo").length;
    document.getElementById("stats-convenios").textContent = `${conveniosData.length} convênio(s) cadastrado(s)`;
    
    const statsBar = document.getElementById("stats-bar");
    if (statsBar) {
        statsBar.innerHTML = `
            <div class="stat-chip">
                <div class="stat-chip-icon" style="background:#EFF6FF;color:#1D4ED8;"><i data-lucide="building-2"></i></div>
                <div>
                    <div class="stat-chip-val">${conveniosData.length}</div>
                    <div class="stat-chip-label">Total Cadastrados</div>
                </div>
            </div>
            <div class="stat-chip">
                <div class="stat-chip-icon" style="background:#F0FDF4;color:#15803D;"><i data-lucide="check-circle"></i></div>
                <div>
                    <div class="stat-chip-val">${ativos}</div>
                    <div class="stat-chip-label">Convênios Ativos</div>
                </div>
            </div>
        `;
    }
    lucide.createIcons();
}

// ==========================================
// 3. VIEW DE DETALHES DO CONVÊNIO
// ==========================================
function openConvenioDetails(id) {
    activeConvenio = conveniosData.find(c => c.id === id);
    if (!activeConvenio) return;

    document.getElementById("view-convenios").classList.add("hidden");
    document.getElementById("view-detalhes").classList.remove("hidden");

    document.getElementById("detalhe-nome-convenio").textContent = activeConvenio.nome;
    document.getElementById("detalhe-titulo").textContent = activeConvenio.nome;
    document.getElementById("detalhe-cnpj").textContent = activeConvenio.cnpj || "00.000.000/0000-00";

    // KPIs fictícios para visualização base, deverão vir da API se necessário no futuro
    document.getElementById("hero-count-medicos").textContent = "—";
    document.getElementById("hero-count-pacientes").textContent = "—";

    switchTab('medicos');
    window.scrollTo(0, 0);
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
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:#94A3B8;">Nenhum médico vinculado até o momento.</td></tr>`;
    } else {
        thead.innerHTML = `<tr><th>Paciente</th><th>CPF</th><th>Status</th><th style="text-align:right">Ações</th></tr>`;
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:#94A3B8;">Nenhum paciente vinculado até o momento.</td></tr>`;
    }
}

// ==========================================
// 4. MODAL NOVO/EDITAR CONVÊNIO
// ==========================================
function openModalAddConvenio() {
    editId = null;
    document.getElementById("modal-convenio-title").textContent = "Novo Convênio";
    document.getElementById("convenio-nome").value = "";
    document.getElementById("convenio-cnpj").value = "";
    document.getElementById("convenio-status").value = "Ativo";
    document.getElementById("convenio-cor").value = "#1746C8";
    document.getElementById("convenio-cor-hex").textContent = "#1746C8";
    document.getElementById("convenio-logo").value = "";
    
    document.getElementById("modal-convenio").classList.remove("hidden");
}

function closeModalConvenio() {
    document.getElementById("modal-convenio").classList.add("hidden");
}

async function saveConvenio() {
    const nome = document.getElementById("convenio-nome").value.trim();
    const cnpj = document.getElementById("convenio-cnpj").value.trim();
    const status = document.getElementById("convenio-status").value;
    const cor = document.getElementById("convenio-cor").value;
    const logoInput = document.getElementById("convenio-logo");

    if (!nome) {
        showToast("O nome do convênio é obrigatório.", "error");
        return;
    }

    let logoBase64 = null;
    if (logoInput.files && logoInput.files[0]) {
        logoBase64 = await toBase64(logoInput.files[0]);
    }

    const payload = { nome, cnpj, status, cor, logo: logoBase64 };

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

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==========================================
// 5. COMPONENTES GLOBAIS E UI
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
    const nome = user.nome || "Admin Principal";
    const iniciais = nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "AD";

    ["profileName", "topbarName"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = nome;
    });
    ["profileAvatar", "topbarAvatar"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = iniciais;
    });
    
    const btnLogout = document.querySelector('.logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/static/login.html');
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