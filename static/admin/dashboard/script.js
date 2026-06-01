const API_URL = "http://localhost:8000/api";

// --- Variáveis Globais ---
let chartData = [];
let kpis = [];

const alertas = [
    { icon: "alert-triangle", bg: "#FEF9EC", color: "#D97706", title: "Tentativa de acesso bloqueada", sub: "IP 192.168.4.22 — bloqueado automaticamente", time: "5h" },
    { icon: "shield-check",   bg: "#ECFDF5", color: "#059669", title: "Auditoria LGPD concluída",       sub: "3.241 registros verificados sem inconsistências", time: "3h" },
    { icon: "file-edit",      bg: "#FFF7ED", color: "#B45309", title: "Alteração cadastral auditada",   sub: "Paciente #0047 editado — log registrado", time: "1h" },
    { icon: "user-check",     bg: "#EFF6FF", color: "#2563EB", title: "Acesso privilegiado autorizado", sub: "Admin concedeu acesso temporário a Dr. Lima", time: "2h" },
    { icon: "lock",           bg: "#F5F3FF", color: "#6D28D9", title: "Política de senha atualizada",   sub: "Requisitos mínimos elevados para 12 caracteres", time: "1d" }
];

const convenioData = [
    { nome: "Unimed",      pct: 34, cor: "#2563EB" },
    { nome: "Bradesco Saúde", pct: 22, cor: "#7C3AED" },
    { nome: "SulAmérica",  pct: 18, cor: "#0891B2" },
    { nome: "Particular",  pct: 15, cor: "#059669" },
    { nome: "Outros",      pct: 11, cor: "#94A3B8" }
];

const topMedicos = [
    { nome: "Dr. Carlos Mendes",   esp: "Clínica Geral",  pacientes: 142, cor: "#DBEAFE", txt: "#1D4ED8" },
    { nome: "Dra. Ana Ferreira",   esp: "Pediatria",      pacientes: 118, cor: "#F5F3FF", txt: "#6D28D9" },
    { nome: "Dr. Roberto Lima",    esp: "Cardiologia",    pacientes: 97,  cor: "#ECFDF5", txt: "#047857" },
    { nome: "Dra. Juliana Costa",  esp: "Psiquiatria",    pacientes: 83,  cor: "#FEF9EC", txt: "#B45309" },
    { nome: "Dr. Marcos Oliveira", esp: "Neurologia",     pacientes: 71,  cor: "#FEF2F2", txt: "#DC2626" }
];

let meuGrafico;
let convenioGrafico;

// --- Busca de Dados no Backend ---
async function carregarDadosDashboard() {
    try {
        const token = localStorage.getItem('aura_token');
        const resposta = await fetch(`${API_URL}/dashboard/resumo`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (resposta.status === 401) {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/static/login.html');
            return;
        }
        const dadosBackend = await resposta.json();
        const dados = {
            total_grupos:   dadosBackend.total_grupos   || 12,
            total_medicos:  dadosBackend.total_medicos  || 48,
            medicos_mes:    dadosBackend.medicos_mes    || 4,
            total_pacientes:dadosBackend.total_pacientes|| 1450,
            pacientes_mes:  dadosBackend.pacientes_mes  || 22,
            total_triagens: dadosBackend.total_triagens || 1483,
            triagens_mes:   dadosBackend.triagens_mes   || 124,
            grafico_triagens: dadosBackend.grafico_triagens || [65, 59, 80, 81, 56, 55, 40, 70, 90, 170, 140, 150]
        };
        kpis = [
            { label: "Grupos / Convênios", value: dados.total_grupos.toString(), delta: "Ativos", deltaLabel: "no ecossistema", icon: "building", color: "#1D4ED8", bg: "#EFF6FF", bar: "#BFDBFE" },
            { label: "Total de Médicos", value: dados.total_medicos.toString(), delta: `+${dados.medicos_mes}`, deltaLabel: "vinculados este mês", icon: "stethoscope", color: "#0369A1", bg: "#E0F2FE", bar: "#BAE6FD" },
            { label: "Pacientes na Base", value: dados.total_pacientes.toString(), delta: `+${dados.pacientes_mes}`, deltaLabel: "registrados este mês", icon: "users", color: "#6D28D9", bg: "#F5F3FF", bar: "#DDD6FE" },
            { label: "Triagens — SXF", value: dados.total_triagens.toString(), delta: `+${dados.triagens_mes}`, deltaLabel: "realizadas este mês", icon: "clipboard-list", color: "#047857", bg: "#ECFDF5", bar: "#A7F3D0" }
        ];
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        chartData = dados.grafico_triagens.map((valor, index) => ({ mes: meses[index], triagens: valor }));
        renderKPIs();
        atualizarGrafico();
        lucide.createIcons();
    } catch (erro) {
        console.error("Erro ao carregar o dashboard:", erro);
    }
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
    // Saudação removida — exibe só o nome no topbar

    const today = new Date().toLocaleDateString("pt-BR", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
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
    const firstName = nome.split(" ")[0];

    ["profileName"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = nome; });
    ["profileAvatar"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = iniciais; });
    const welcomeNameEl = document.getElementById("welcomeName");
    if (welcomeNameEl) welcomeNameEl.innerHTML = `${firstName} <span class="welcome-wave">👋</span>`;

    initNotifications();
    initChart();
    initConvenioChart();
    renderTopMedicos();
    renderAlertas();
    lucide.createIcons();
    carregarDadosDashboard();
});

// --- KPIs ---
function renderKPIs() {
    const grid = document.getElementById("kpi-grid");
    grid.innerHTML = "";
    kpis.forEach(kpi => {
        const div = document.createElement("div");
        div.className = "kpi-card";
        div.innerHTML = `
            <div class="kpi-header">
                <p class="kpi-label">${kpi.label}</p>
                <div class="kpi-icon" style="background: ${kpi.bg}">
                    <i data-lucide="${kpi.icon}" style="color: ${kpi.color}"></i>
                </div>
            </div>
            <p class="kpi-value">${kpi.value}</p>
            <div class="progress-bg"><div class="progress-fill" style="background: ${kpi.bar}"></div></div>
            <div class="kpi-delta">
                <span class="delta-val" style="color: ${kpi.color}">${kpi.delta}</span>
                <span class="delta-label">${kpi.deltaLabel}</span>
            </div>`;
        grid.appendChild(div);
    });
}

// --- Alertas & Conformidade ---
function renderAlertas() {
    const list = document.getElementById("alertasList");
    if (!list) return;
    list.innerHTML = "";
    alertas.forEach(a => {
        const div = document.createElement("div");
        div.className = "alerta-item";
        div.style.background = a.bg;
        div.innerHTML = `
            <i data-lucide="${a.icon}" style="color:${a.color}"></i>
            <div class="alerta-body">
                <p class="alerta-title">${a.title}</p>
                <p class="alerta-sub">${a.sub}</p>
            </div>
            <span class="alerta-time">${a.time}</span>`;
        list.appendChild(div);
    });
}
// --- Gráfico de Triagens ---
function initChart() {
    const ctx = document.getElementById('triagensChart').getContext('2d');
    meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Triagens', data: [], backgroundColor: '#2563EB', borderRadius: { topLeft: 5, topRight: 5, bottomLeft: 0, bottomRight: 0 }, borderSkipped: false, barPercentage: 0.5, categoryPercentage: 0.8 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#0D1B35', titleColor: 'rgba(255,255,255,0.6)', bodyColor: '#ffffff', bodyFont: { weight: 'bold', size: 12 }, padding: 10, displayColors: false, cornerRadius: 8, callbacks: { title: (i) => i[0].label, label: (i) => `${i.raw} triagens` } }
            },
            scales: {
                x: { grid: { display: false, drawBorder: false }, ticks: { color: '#94A3B8', font: { size: 11, family: "'Inter', sans-serif" } } },
                y: { grid: { color: '#F1F5F9', borderDash: [3, 3], drawBorder: false }, ticks: { color: '#94A3B8', font: { size: 11, family: "'Inter', sans-serif" }, padding: 10 } }
            }
        }
    });
}
function atualizarGrafico() {
    meuGrafico.data.labels = chartData.map(d => d.mes);
    meuGrafico.data.datasets[0].data = chartData.map(d => d.triagens);
    meuGrafico.update();
}

// --- Donut de Convênios ---
function initConvenioChart() {
    const ctx = document.getElementById('convenioChart').getContext('2d');
    const total = convenioData.reduce((s, d) => s + d.pct, 0);
    convenioGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: convenioData.map(d => d.nome),
            datasets: [{ data: convenioData.map(d => d.pct), backgroundColor: convenioData.map(d => d.cor), borderWidth: 2, borderColor: '#ffffff', hoverOffset: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#0D1B35', titleColor: 'rgba(255,255,255,0.6)', bodyColor: '#fff', padding: 8, cornerRadius: 8, displayColors: true, callbacks: { label: (i) => ` ${i.raw}% dos pacientes` } }
            }
        }
    });
    const legend = document.getElementById("donutLegend");
    convenioData.forEach(d => {
        const item = document.createElement("div");
        item.className = "legend-item";
        item.innerHTML = `<span class="legend-dot" style="background:${d.cor}"></span><span class="legend-name">${d.nome}</span><span class="legend-pct">${d.pct}%</span>`;
        legend.appendChild(item);
    });
}

// --- Top Médicos ---
function renderTopMedicos() {
    const list = document.getElementById("topMedicosList");
    list.innerHTML = "";
    topMedicos.forEach((m, i) => {
        const iniciais = m.nome.replace("Dr. ","").replace("Dra. ","").split(" ").slice(0,2).map(n=>n[0]).join("");
        const row = document.createElement("div");
        row.className = "medico-row";
        row.innerHTML = `
            <span class="medico-rank">${i+1}</span>
            <div class="medico-avatar" style="background:${m.cor};color:${m.txt}">${iniciais}</div>
            <div class="medico-info">
                <p class="medico-name">${m.nome}</p>
                <p class="medico-especialidade">${m.esp}</p>
            </div>
            <div class="medico-count">
                <span class="medico-num">${m.pacientes}</span>
                <span class="medico-num-label">pac.</span>
            </div>`;
        list.appendChild(row);
    });
}

// --- Notificações ---
const notificacoes = [
    { icon: "alert-triangle", iconBg: "#FEF9EC", iconColor: "#D97706", text: "Tentativa de acesso bloqueada — IP 192.168.4.22", time: "5h atrás", unread: true },
    { icon: "user-plus",      iconBg: "#F5F3FF", iconColor: "#6D28D9", text: "Novo paciente #1451 registrado na base", time: "22 min atrás", unread: true },
    { icon: "check-circle",   iconBg: "#F0FDF4", iconColor: "#059669", text: "Vínculos do Dr. Carlos Mendes atualizados", time: "5 min atrás", unread: true },
    { icon: "file-edit",      iconBg: "#FFF7ED", iconColor: "#B45309", text: "Perfil do Paciente #0047 editado por Admin", time: "1h atrás", unread: false },
    { icon: "database",       iconBg: "#ECFDF5", iconColor: "#047857", text: "Log de auditoria LGPD sincronizado com sucesso", time: "3h atrás", unread: false }
];

function initNotifications() {
    const btn = document.getElementById("notifBtn");
    const panel = document.getElementById("notifPanel");
    const list = document.getElementById("notifList");
    const markAll = document.getElementById("markAllRead");
    if (!btn || !panel || !list) return;

    function renderNotifs() {
        list.innerHTML = "";
        notificacoes.forEach((n, idx) => {
            const item = document.createElement("div");
            item.className = "notif-item" + (n.unread ? " unread" : "");
            item.innerHTML = `
                <div class="notif-item-icon" style="background:${n.iconBg}">
                    <i data-lucide="${n.icon}" style="color:${n.iconColor}"></i>
                </div>
                <div class="notif-item-body">
                    <p class="notif-item-text">${n.text}</p>
                    <p class="notif-item-time">${n.time}</p>
                </div>
                ${n.unread ? '<span class="notif-unread-dot"></span>' : ''}`;
            item.addEventListener("click", () => {
                notificacoes[idx].unread = false;
                updateDot();
                renderNotifs();
                lucide.createIcons();
            });
            list.appendChild(item);
        });
        lucide.createIcons();
    }

    function updateDot() {
        const dot = btn.querySelector(".notification-dot");
        const hasUnread = notificacoes.some(n => n.unread);
        if (dot) dot.style.display = hasUnread ? "" : "none";
    }

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.classList.toggle("open");
        if (panel.classList.contains("open")) {
            renderNotifs();
        }
    });

    markAll.addEventListener("click", () => {
        notificacoes.forEach(n => n.unread = false);
        updateDot();
        renderNotifs();
    });

    document.addEventListener("click", (e) => {
        if (!panel.contains(e.target) && e.target !== btn) {
            panel.classList.remove("open");
        }
    });

    updateDot();
}

// --- Logout ---
const btnLogout = document.querySelector('.logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        window.location.replace('/static/login.html');
    });
}