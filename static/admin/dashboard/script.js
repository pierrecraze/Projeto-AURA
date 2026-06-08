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

const convenioData = [];
const topMedicos = [];

let meuGrafico;
let convenioGrafico;

// --- Busca de Dados no Backend ---
async function carregarDadosDashboard() {
    try {
        const token = localStorage.getItem('aura_token');
        const opts = { headers: { 'Authorization': `Bearer ${token}` } };

        // Fetch protegido contra falhas. O .catch garante que se a rota não existir, ele não trava a página inteira
        const [resResumo, resMed, resGrupos, resPac] = await Promise.all([
            fetch(`${API_URL}/dashboard/resumo`, opts).catch(() => null),
            fetch(`${API_URL}/medicos/`, opts).catch(() => null),
            fetch(`${API_URL}/grupos/`, opts).catch(() => null),
            fetch(`${API_URL}/pacientes/`, opts).catch(() => null)
        ]);

        if (resResumo && resResumo.status === 401) {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/static/login.html');
            return;
        }

        // Parse seguro das respostas do banco. Se vier 404, usamos arrays/objetos vazios padrões.
        let dashboardData = resResumo && resResumo.ok ? await resResumo.json() : {
            total_grupos: 0, total_medicos: 0, medicos_mes: 0, total_pacientes: 0, pacientes_mes: 0, total_triagens: 0, triagens_mes: 0, grafico_triagens: [0,0,0,0,0,0,0,0,0,0,0,0]
        };
        
        let dbMed = resMed && resMed.ok ? await resMed.json() : [];
        if (!Array.isArray(dbMed)) dbMed = [];
        
        let dbGrupos = resGrupos && resGrupos.ok ? await resGrupos.json() : [];
        if (!Array.isArray(dbGrupos)) dbGrupos = [];
        
        let dbPac = resPac && resPac.ok ? await resPac.json() : [];
        if (!Array.isArray(dbPac)) dbPac = [];

        kpis = [
            { label: "Grupos / Convênios", value: dashboardData.total_grupos, delta: "Ativos", deltaLabel: "no ecossistema", icon: "building", color: "#1D4ED8", bg: "#EFF6FF", bar: "#BFDBFE" },
            { label: "Total de Médicos", value: dashboardData.total_medicos, delta: `+${dashboardData.medicos_mes}`, deltaLabel: "este mês", icon: "stethoscope", color: "#0369A1", bg: "#E0F2FE", bar: "#BAE6FD" },
            { label: "Pacientes na Base", value: dashboardData.total_pacientes, delta: `+${dashboardData.pacientes_mes}`, deltaLabel: "este mês", icon: "users", color: "#6D28D9", bg: "#F5F3FF", bar: "#DDD6FE" },
            { label: "Triagens — SXF", value: dashboardData.total_triagens, delta: `+${dashboardData.triagens_mes}`, deltaLabel: "este mês", icon: "clipboard-list", color: "#047857", bg: "#ECFDF5", bar: "#A7F3D0" }
        ];

        const mesesLabel = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        chartData = (dashboardData.grafico_triagens || [0,0,0,0,0,0,0,0,0,0,0,0]).map((valor, index) => {
            return { mes: mesesLabel[index], triagens: valor || 0 };
        });

        document.getElementById("statTotalPeriodo").textContent = dashboardData.total_triagens || 0;
        document.getElementById("statMediaMensal").textContent = Math.round((dashboardData.total_triagens || 0) / 12);
        
        const graficoArray = dashboardData.grafico_triagens || [0];
        const pico = Math.max(...graficoArray);
        const picoMesIdx = graficoArray.indexOf(pico);
        document.getElementById("statPicoMes").textContent = `Pico (${mesesLabel[picoMesIdx] || '-'})`;
        document.getElementById("statPicoValor").textContent = pico;

        convenioData.length = 0;
        const ativos = dbPac.filter(p => !p.deletado_em && p.status !== 'Inativo').length;
        document.getElementById("donutTotal").textContent = ativos;
        
        const legend = document.getElementById("donutLegend");
        if(legend) legend.innerHTML = "";
        
        if (ativos === 0) {
            // Estado Vazio (quando não há pacientes)
            convenioData.push({ nome: "Sem pacientes", pct: 100, cor: "#E2E8F0" });
            if (legend) legend.innerHTML = `<p style="color:#94A3B8; font-size:12px; margin-top:10px;">Cadastre pacientes para visualizar estatísticas de convênios.</p>`;
        } else {
            dbGrupos.forEach(c => {
                const pacCount = dbPac.filter(p => p.instituicao_id === c.id && !p.deletado_em && p.status !== 'Inativo').length;
                const pct = ativos > 0 ? Math.round((pacCount / ativos) * 100) : 0;
                const cor = c.cor || '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                
                if (pct > 0) {
                    convenioData.push({ nome: c.nome_fantasia || c.nome, pct: pct, cor: cor });
                    if (legend) {
                        const item = document.createElement("div");
                        item.className = "legend-item";
                        item.innerHTML = `<span class="legend-dot" style="background:${cor}"></span><span class="legend-name">${c.nome_fantasia || c.nome}</span><span class="legend-pct">${pct}%</span>`;
                        legend.appendChild(item);
                    }
                }
            });
        }

        topMedicos.length = 0;
        const medicosMapped = dbMed.map(m => {
            const pacientesDoMedico = dbPac.filter(p => p.cadastrado_por_id === m.id).length;
            const colors = [
                { cor: "#DBEAFE", txt: "#1D4ED8" },
                { cor: "#F5F3FF", txt: "#6D28D9" },
                { cor: "#ECFDF5", txt: "#047857" },
                { cor: "#FEF9EC", txt: "#B45309" },
                { cor: "#FEF2F2", txt: "#DC2626" }
            ];
            const c = colors[m.id % colors.length];
            return {
                nome: m.nome,
                esp: m.crm ? `CRM ${m.crm}` : "Médico",
                pacientes: pacientesDoMedico,
                cor: c.cor,
                txt: c.txt
            };
        });
        
        medicosMapped.sort((a,b) => b.pacientes - a.pacientes).slice(0,5).forEach(m => {
            if (m.pacientes > 0 || dbMed.length > 0) topMedicos.push(m);
        });

        renderKPIs();
        renderTopMedicos();
        if(meuGrafico) atualizarGrafico();
        if(convenioGrafico) {
            convenioGrafico.data.labels = convenioData.map(d => d.nome);
            convenioGrafico.data.datasets[0].data = convenioData.map(d => d.pct);
            convenioGrafico.data.datasets[0].backgroundColor = convenioData.map(d => d.cor);
            convenioGrafico.update();
        }

    } catch (err) {
        console.error("Erro ao carregar dados do Dashboard:", err);
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
    if (!list) return;
    list.innerHTML = "";
    if (topMedicos.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#94A3B8; padding: 25px 0; font-size:12px;">Nenhum médico cadastrado ainda.</p>`;
        return;
    }
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