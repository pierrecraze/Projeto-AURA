const API_URL = "http://localhost:8000/api";

// --- Variáveis Globais ---
let chartData = [];
let kpis = [];
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

let meuGrafico; 

// --- Busca de Dados no Backend ---
async function carregarDadosDashboard() {
    try {
        const token = localStorage.getItem('aura_token');

        const resposta = await fetch(`${API_URL}/dashboard/resumo`, {
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

        const dadosBackend = await resposta.json();
        console.log("Dados recebidos da API AURA:", dadosBackend);
        
        // MOCK INTELIGENTE: Mescla o que o Python mandou com dados falsos para a tela não ficar zerada
        const dados = {
            total_grupos: dadosBackend.total_grupos || 12,
            total_medicos: dadosBackend.total_medicos || 48,
            medicos_mes: dadosBackend.medicos_mes || 4,
            total_pacientes: dadosBackend.total_pacientes || 1450,
            pacientes_mes: dadosBackend.pacientes_mes || 22,
            total_triagens: dadosBackend.total_triagens || 1483,
            triagens_mes: dadosBackend.triagens_mes || 124,
            grafico_triagens: dadosBackend.grafico_triagens || [65, 59, 80, 81, 56, 55, 40, 70, 90, 170, 140, 150]
        };

        // Atualiza o array de KPIs
        kpis = [
            { label: "Grupos / Convênios", value: dados.total_grupos.toString(), delta: "Ativos", deltaLabel: "no ecossistema", icon: "building", color: "#1D4ED8", bg: "#EFF6FF", bar: "#BFDBFE" },
            { label: "Total de Médicos", value: dados.total_medicos.toString(), delta: `+${dados.medicos_mes}`, deltaLabel: "vinculados este mês", icon: "stethoscope", color: "#0369A1", bg: "#E0F2FE", bar: "#BAE6FD" },
            { label: "Pacientes na Base", value: dados.total_pacientes.toString(), delta: `+${dados.pacientes_mes}`, deltaLabel: "registrados este mês", icon: "users", color: "#6D28D9", bg: "#F5F3FF", bar: "#DDD6FE" },
            { label: "Triagens — SXF", value: dados.total_triagens.toString(), delta: `+${dados.triagens_mes}`, deltaLabel: "realizadas este mês", icon: "clipboard-list", color: "#047857", bg: "#ECFDF5", bar: "#A7F3D0" }
        ];

        // Atualiza o gráfico
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        
        chartData = dados.grafico_triagens.map((valor, index) => {
            return { mes: meses[index], triagens: valor };
        });

        // Manda redesenhar a tela
        renderKPIs();
        atualizarGrafico();
        lucide.createIcons();

    } catch (erro) {
        console.error("Erro ao carregar o dashboard:", erro);
    }
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    document.getElementById("current-date").textContent = today;

    initChart();
    renderActivities();
    lucide.createIcons();
    
    carregarDadosDashboard();
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
    
    meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], 
            datasets: [{
                label: 'Triagens',
                data: [], 
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

function atualizarGrafico() {
    meuGrafico.data.labels = chartData.map(d => d.mes);
    meuGrafico.data.datasets[0].data = chartData.map(d => d.triagens);
    meuGrafico.update(); 
}

// --- Sistema de Logout ---
const btnLogout = document.querySelector('.logout');

if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        window.location.replace('/static/login.html'); 
    });
}