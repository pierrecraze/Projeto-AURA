// --- Dados Operacionais Reais ---
const chartData = [
    { mes: "Jan", triagens: 68 }, { mes: "Fev", triagens: 82 },
    { mes: "Mar", triagens: 95 }, { mes: "Abr", triagens: 110 },
    { mes: "Mai", triagens: 88 }, { mes: "Jun", triagens: 124 },
    { mes: "Jul", triagens: 145 }, { mes: "Ago", triagens: 132 },
    { mes: "Set", triagens: 158 }, { mes: "Out", triagens: 170 },
    { mes: "Nov", triagens: 148 }, { mes: "Dez", triagens: 163 },
];

const kpis = [
    { label: "Grupos / Convênios", value: "5", delta: "Ativos", deltaLabel: "no ecossistema", icon: "building", color: "#1D4ED8", bg: "#EFF6FF", bar: "#BFDBFE" },
    { label: "Total de Médicos", value: "42", delta: "+3", deltaLabel: "vinculados este mês", icon: "stethoscope", color: "#0369A1", bg: "#E0F2FE", bar: "#BAE6FD" },
    { label: "Pacientes na Base", value: "1.204", delta: "+28", deltaLabel: "registrados este mês", icon: "users", color: "#6D28D9", bg: "#F5F3FF", bar: "#DDD6FE" },
    { label: "Triagens — SXF", value: "856", delta: "+15", deltaLabel: "realizadas este mês", icon: "clipboard-list", color: "#047857", bg: "#ECFDF5", bar: "#A7F3D0" }
];

const activities = [
    { type: "info", icon: "building", text: "Novo grupo de convênio configurado", sub: "Particular (Sem Convênio)", time: "5 min" },
    { type: "success", icon: "check-circle", text: "Vínculos de médicos atualizados", sub: "Dr. Carlos Mendes -> Unimed", time: "25 min" },
    { type: "info", icon: "users", text: "Novo paciente alocado por operadora", sub: "Aba Unimed atualizada automaticamente", time: "1h" },
    { type: "success", icon: "database", text: "Log de auditoria sincronizado", sub: "Em conformidade rígida com a LGPD", time: "2h" },
    { type: "alert", icon: "alert-triangle", text: "Alteração cadastral registrada em log", sub: "Perfil do Paciente #0003 editado", time: "4h" }
];

const typeStyles = {
    success: { bg: "#F0FDF4", color: "#059669" },
    info:    { bg: "#EFF6FF", color: "#2563EB" },
    alert:   { bg: "#FEF2F2", color: "#DC2626" }
};

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    document.getElementById("current-date").textContent = today;

    renderKPIs();
    renderActivities();
    initChart();
    
    // Instancia os ícones Lucide no carregamento
    lucide.createIcons(); 
});

// --- Injeções de Componentes no DOM ---
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
            <div class="progress-bg">
                <div class="progress-fill" style="background: ${kpi.bar}"></div>
            </div>
            <div class="kpi-delta">
                <span class="delta-val" style="color: ${kpi.color}">${kpi.delta}</span>
                <span class="delta-label">${kpi.deltaLabel}</span>
            </div>
        `;
        grid.appendChild(div);
    });
}

function renderActivities() {
    const list = document.getElementById("activity-list");
    list.innerHTML = "";

    activities.forEach(act => {
        const style = typeStyles[act.type] || typeStyles.info;
        const div = document.createElement("div");
        div.className = "activity-item";
        div.innerHTML = `
            <div class="act-icon-wrap" style="background: ${style.bg}">
                <i data-lucide="${act.icon}" style="color: ${style.color}"></i>
            </div>
            <div class="act-content">
                <p class="act-title">${act.text}</p>
                <p class="act-sub">${act.sub}</p>
            </div>
            <span class="act-time">${act.time}</span>
        `;
        list.appendChild(div);
    });
}

// --- Configuração Customizada do Chart.js ---
function initChart() {
    const ctx = document.getElementById('triagensChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.mes),
            datasets: [{
                label: 'Triagens',
                data: chartData.map(d => d.triagens),
                backgroundColor: '#2563EB',
                borderRadius: { topLeft: 5, topRight: 5, bottomLeft: 0, bottomRight: 0 },
                borderSkipped: false,
                barPercentage: 0.5,
                categoryPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0F2347',
                    titleColor: 'rgba(255,255,255,0.6)',
                    bodyColor: '#ffffff',
                    bodyFont: { weight: 'bold', size: 12 },
                    titleFont: { size: 12 },
                    padding: 10,
                    displayColors: false,
                    cornerRadius: 8,
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (item) => `${item.raw} triagens`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#94A3B8', font: { size: 11, family: "'Inter', sans-serif" } }
                },
                y: {
                    grid: { color: '#F1F5F9', borderDash: [3, 3], drawBorder: false },
                    ticks: { color: '#94A3B8', font: { size: 11, family: "'Inter', sans-serif" }, padding: 10 }
                }
            }
        }
    });
}