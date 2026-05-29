const API_URL = "http://localhost:8000/api";

// --- Variáveis Globais (Iniciam vazias/zeradas e serão preenchidas pela API) ---
let chartData = [];
let kpis = [];
// Mantive as activities fixas por enquanto até ligarmos a API de Logs
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

let meuGrafico; // Variável global para guardar a instância do gráfico

// --- Busca de Dados no Backend ---
async function carregarDadosDashboard() {
    try {
        const resposta = await fetch(`${API_URL}/dashboard/resumo`);
        const dados = await resposta.json();
        
        console.log("Dados recebidos da API AURA:", dados);
        
        // 1. Atualiza o array de KPIs com proteção (|| 0)
        kpis = [
            { label: "Grupos / Convênios", value: (dados.total_grupos || 0).toString(), delta: "Ativos", deltaLabel: "no ecossistema", icon: "building", color: "#1D4ED8", bg: "#EFF6FF", bar: "#BFDBFE" },
            { label: "Total de Médicos", value: (dados.total_medicos || 0).toString(), delta: `+${dados.medicos_mes || 0}`, deltaLabel: "vinculados este mês", icon: "stethoscope", color: "#0369A1", bg: "#E0F2FE", bar: "#BAE6FD" },
            { label: "Pacientes na Base", value: (dados.total_pacientes || 0).toString(), delta: `+${dados.pacientes_mes || 0}`, deltaLabel: "registrados este mês", icon: "users", color: "#6D28D9", bg: "#F5F3FF", bar: "#DDD6FE" },
            { label: "Triagens — SXF", value: (dados.total_triagens || 0).toString(), delta: `+${dados.triagens_mes || 0}`, deltaLabel: "realizadas este mês", icon: "clipboard-list", color: "#047857", bg: "#ECFDF5", bar: "#A7F3D0" }
        ];

        // 2. Proteção para o gráfico (se a lista não vier, usa uma lista de zeros)
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const graficoDados = dados.grafico_triagens || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        
        chartData = graficoDados.map((valor, index) => {
            return { mes: meses[index], triagens: valor };
        });

        // 3. Manda redesenhar a tela
        renderKPIs();
        atualizarGrafico();
        lucide.createIcons();
    } catch (erro) {
        console.error("Erro ao carregar o dashboard:", erro);
        // Em um cenário real, você poderia exibir um toast de erro aqui
    }
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    document.getElementById("current-date").textContent = today;

    // Inicializa o gráfico vazio primeiro, para não dar "pulo" na tela
    initChart();
    renderActivities();
    lucide.createIcons();
    
    // Busca os dados da API
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
            labels: [], // Começa vazio
            datasets: [{
                label: 'Triagens',
                data: [], // Começa vazio
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

// Função para injetar os dados no gráfico depois que eles chegam da API
function atualizarGrafico() {
    meuGrafico.data.labels = chartData.map(d => d.mes);
    meuGrafico.data.datasets[0].data = chartData.map(d => d.triagens);
    meuGrafico.update(); // Manda a biblioteca redesenhar
}

// 1. Antes de pedir os dados, pegamos a pulseira no cofre do navegador
const token = localStorage.getItem('aura_token');

// 2. Fazemos o pedido ao Python passando a pulseira junto
fetch('http://localhost:8000/api/dashboard/resumo', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        // Aqui está a mágica: O anexo da Pulseira VIP
        'Authorization': `Bearer ${token}` 
    }
})
.then(response => {
    // 3. A verificação do Barman
    if (response.status === 401) {
        // Se a pulseira for falsa ou tiver passado dos 60 minutos (vencida)
        console.error('Sessão expirada ou token inválido');
        localStorage.removeItem('aura_token'); // Arrancamos a pulseira velha
        window.location.replace('/static/login.html'); // Chutamos para a porta de entrada
        throw new Error('Sessão expirada'); // Para a execução do código
    }
    
    // Se o status for 200 OK, a pulseira é válida! Pegamos os dados.
    return response.json();
})
.then(dados => {
    // 4. Aqui você injeta os dados reais no seu HTML (KPIs, gráficos, etc.)
    console.log("Dados recebidos com sucesso:", dados);
    // Exemplo: document.getElementById('kpi-total').textContent = dados.total;
})
.catch(error => {
    console.error('Erro ao buscar dados:', error);
});