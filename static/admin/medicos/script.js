/* ─── Configuração da API ──────────────────────────────────── */
const API_URL = "http://localhost:8000/api";

/* ─── Dados (preenchidos pela API) ─────────────────────────── */
let medicos    = [];
let convenios  = [];
let pacientes  = [];
let triagens   = [];
let allCities  = [];
let allStates  = [];

/* ─── Estado da UI ─────────────────────────────────────────── */
let state = {
    view: 'lista',          // 'lista' | 'perfil'
    activeMedicoId: null,
    visList: 'tabela',      // 'tabela' | 'cards'
    kpiFilter: 'Todos',
    statusFilter: '',
    searchQuery: '',
    editingId: null,        // id do médico sendo editado no modal
    senhaSufixo: '',        // sufixo dinâmico para a senha do médico
    pfTab: 'pacientes'       // aba ativa no perfil: 'pacientes' | 'triagens'
};

/* ─── Utilitários ───────────────────────────────────────────── */
const initials  = n  => n.replace(/^Dr[a]?\. /, "").split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
const avatarBg  = id => ["#1D4ED8","#0369A1","#6D28D9","#047857","#B45309","#9D174D"][id % 6];
const getBadge  = s  => `<span class="status-badge ${s.toLowerCase()}"><span class="dot"></span>${s}</span>`;

/* ─── Carga de Dados ────────────────────────────────────────── */
async function carregarDados() {
    try {
        const token = localStorage.getItem('aura_token');
        const opts = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };

        const [resMed, resGrupos, resPac, resTriagens] = await Promise.all([
            fetch(`${API_URL}/medicos/`,   opts),
            fetch(`${API_URL}/grupos/`,    opts),
            fetch(`${API_URL}/pacientes/`, opts),
            fetch(`${API_URL}/triagens/`,  opts)
        ]);

        if ([resMed, resGrupos, resPac, resTriagens].some(r => r.status === 401)) {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/login.html');
            return;
        }

        const dbMed    = await resMed.json();
        const dbGrupos = await resGrupos.json();
        const dbPac    = await resPac.json();
        const dbTriagens = await resTriagens.json();

        convenios = dbGrupos.map(g => ({ id: g.id, nome: g.nome_fantasia || g.nome || "Sem nome", cnpj: g.cnpj || "00.000.000/0000-00", status: g.status || "Ativo" }));

        medicos = dbMed.map(m => ({
            id:           m.id,
            nome:         m.nome,
            cpf:          m.cpf        || "—",
            crm:          m.crm        || "—",
            data_nascimento: m.data_nascimento || "—",
            telefone:     m.telefone   || "—",
            email:        m.email      || "—",
            cidade:       m.cidade     || "—",
            uf:           m.uf         || "—",
            ingresso:     m.ingresso   || "—",
            status:       m.status     || "Ativo",
            convenios:    (m.grupos || []).map(nome => {
                const g = convenios.find(c => c.nome === nome);
                return g ? g.id : null;
            }).filter(x => x !== null)
        }));

        pacientes = dbPac.map(p => ({
            id:        p.id,
            nome:      p.nome,
            doc:       `CPF ${p.cpf}`,
            status:    p.status,
            convenios: (p.grupos || []).map(nome => {
                const g = convenios.find(c => c.nome === nome);
                return g ? g.id : null;
            }).filter(x => x !== null),
            medicoId:  p.medico_id || null
        }));

        triagens = dbTriagens.map(t => ({
            id: t.id,
            medicoId: t.medico_id,
            pacienteId: t.paciente_id,
            dataHora: t.data_hora
        }));

        renderApp();
    } catch (err) {
        console.error("Erro ao carregar:", err);
        usarDadosDemostracao();
    }
}

/* ─── Dados de Demonstração (fallback) ─────────────────────── */
function usarDadosDemostracao() {
    convenios = [
        { id: 1, nome: "Unimed",         cnpj: "00.000.001/0001-00", status: "Ativo" },
        { id: 2, nome: "Bradesco Saúde", cnpj: "00.000.002/0001-00", status: "Ativo" },
        { id: 3, nome: "SulAmérica",     cnpj: "00.000.003/0001-00", status: "Ativo" },
        { id: 4, nome: "Particular",     cnpj: "00.000.004/0001-00", status: "Ativo" },
    ];
    medicos = [
        { id: 1, nome: "Dr. Carlos Mendes",   crm: "12345", cpf: "111.222.333-44", data_nascimento: "1980-05-10", telefone: "(41) 99100-0001", email: "carlos.mendes@ibk.med.br",   cidade: "Curitiba", uf: "PR", ingresso: "Mar 2021", status: "Ativo",   convenios: [1, 2] },
        { id: 2, nome: "Dra. Ana Ferreira",   crm: "22890", cpf: "222.333.444-55", data_nascimento: "1982-07-15", telefone: "(41) 99100-0002", email: "ana.ferreira@ibk.med.br",    cidade: "Curitiba", uf: "PR", ingresso: "Jun 2020", status: "Ativo",   convenios: [1, 3] },
        { id: 3, nome: "Dr. Roberto Lima",    crm: "33401", cpf: "333.444.555-66", data_nascimento: "1975-01-20", telefone: "(41) 99100-0003", email: "roberto.lima@ibk.med.br",    cidade: "São José", uf: "SC", ingresso: "Jan 2022", status: "Ativo",   convenios: [2]    },
        { id: 4, nome: "Dra. Juliana Costa",  crm: "44102", cpf: "444.555.666-77", data_nascimento: "1988-11-05", telefone: "(41) 99100-0004", email: "juliana.costa@ibk.med.br",   cidade: "Curitiba", uf: "PR", ingresso: "Set 2019", status: "Ativo",   convenios: [1, 4] },
        { id: 5, nome: "Dr. Marcos Oliveira", crm: "55230", cpf: "555.666.777-88", data_nascimento: "1979-02-28", telefone: "(11) 99100-0005", email: "marcos.oliveira@ibk.med.br", cidade: "São Paulo", uf: "SP", ingresso: "Fev 2023", status: "Inativo", convenios: [3]    },
        { id: 6, nome: "Dra. Fernanda Rocha", crm: "66781", cpf: "666.777.888-99", data_nascimento: "1990-09-12", telefone: "(41) 99100-0006", email: "fernanda.rocha@ibk.med.br",  cidade: "Curitiba", uf: "PR", ingresso: "Out 2022", status: "Ativo",   convenios: [1, 2, 3] },
        { id: 7, nome: "Dr. Paulo Souza",     crm: "77002", cpf: "777.888.999-00", data_nascimento: "1985-04-16", telefone: "(41) 99100-0007", email: "paulo.souza@ibk.med.br",     cidade: "Londrina", uf: "PR", ingresso: "Jul 2021", status: "Ativo",   convenios: [2, 4] },
        { id: 8, nome: "Dra. Camila Nunes",   crm: "88543", cpf: "888.999.000-11", data_nascimento: "1992-12-01", telefone: "(51) 99100-0008", email: "camila.nunes@ibk.med.br",    cidade: "Porto Alegre", uf: "RS", ingresso: "Abr 2020", status: "Ativo", convenios: [1]  },
    ];
    pacientes = [
        { id: 101, nome: "João Silva",       doc: "CPF 111.222.333-44", status: "Ativo",   convenios: [1],    medicoId: 1 },
        { id: 102, nome: "Maria Souza",      doc: "CPF 222.333.444-55", status: "Ativo",   convenios: [1, 2], medicoId: 1 },
        { id: 103, nome: "Pedro Alves",      doc: "CPF 333.444.555-66", status: "Inativo", convenios: [2],    medicoId: 3 },
        { id: 104, nome: "Lucia Martins",    doc: "CPF 444.555.666-77", status: "Ativo",   convenios: [1],    medicoId: 2 },
        { id: 105, nome: "Carlos Pereira",   doc: "CPF 555.666.777-88", status: "Ativo",   convenios: [3],    medicoId: 2 },
        { id: 106, nome: "Ana Beatriz Lima", doc: "CPF 666.777.888-99", status: "Ativo",   convenios: [1, 3], medicoId: 4 },
        { id: 107, nome: "Bruno Costa",      doc: "CPF 777.888.999-00", status: "Ativo",   convenios: [4],    medicoId: 1 },
        { id: 108, nome: "Patrícia Rocha",   doc: "CPF 888.999.000-11", status: "Ativo",   convenios: [1],    medicoId: 6 },
        { id: 109, nome: "Rafael Nunes",     doc: "CPF 999.000.111-22", status: "Ativo",   convenios: [2],    medicoId: 7 },
        { id: 110, nome: "Isabela Freitas",  doc: "CPF 000.111.222-33", status: "Inativo", convenios: [1],    medicoId: 8 },
    ];
    triagens = [];
    pacientes.forEach((p, idx) => {
        triagens.push({ id: triagens.length + 1, medicoId: p.medicoId || 1, pacienteId: p.id, dataHora: `2026-05-${String(10 + (idx % 15)).padStart(2,'0')}T10:30:00` });
        if (Math.random() > 0.5) {
            triagens.push({ id: triagens.length + 1, medicoId: p.medicoId || 1, pacienteId: p.id, dataHora: `2026-05-${String(12 + (idx % 15)).padStart(2,'0')}T14:15:00` });
        }
    });
    renderApp();
}

/* ─── Inicialização ─────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    document.getElementById("current-date").textContent = today;

    setupProfile();
    setupNotificacoes();

    // Busca live
    document.getElementById("search-input").addEventListener("input", e => {
        state.searchQuery = e.target.value.toLowerCase();
        renderApp();
    });

    // Atalho Ctrl+K
    document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            document.getElementById("search-input").focus();
        }
    });

    carregarLocalidades();
    setupLocalidadesEvents();
    setupMascarasMedicos();

    const inputNome = document.getElementById("medico-nome");
    if (inputNome) {
        inputNome.addEventListener("input", (e) => {
            if (!state.editingId && state.senhaSufixo) {
                const nameParts = e.target.value.replace(/^Dr[a]?\.?\s*/i, "").split(" ").filter(Boolean);
                let firstName = nameParts.length > 0 ? nameParts[0] : "Medico";
                firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                document.getElementById("medico-senha").value = `${firstName}${state.senhaSufixo}`;
            }
        });
    }

    carregarDados();
});

/* ─── Render Principal ──────────────────────────────────────── */
function renderApp() {
    const vLista  = document.getElementById("view-lista");
    const vPerfil = document.getElementById("view-perfil");

    if (state.view === 'lista') {
        vLista.classList.remove("hidden");
        vPerfil.classList.add("hidden");
        renderLista();
    } else {
        vLista.classList.add("hidden");
        vPerfil.classList.remove("hidden");
        renderPerfil();
    }
    lucide.createIcons();
}

/* ─── Tela 1: Lista ─────────────────────────────────────────── */
function getMedicosFiltrados() {
    let lista = medicos;

    // Filtro KPI
    if (state.kpiFilter === 'Ativo' || state.kpiFilter === 'Inativo') {
        lista = lista.filter(m => m.status === state.kpiFilter);
    }

    // Dropdown Status Override
    if (state.statusFilter) {
        lista = lista.filter(m => m.status === state.statusFilter);
    }

    // Busca
    if (state.searchQuery) {
        lista = lista.filter(m =>
            m.nome.toLowerCase().includes(state.searchQuery) ||
            (m.crm && m.crm.toLowerCase().includes(state.searchQuery)) ||
            (m.cpf && m.cpf.toLowerCase().includes(state.searchQuery))
        );
    }

    return lista;
}

function renderLista() {
    const lista = getMedicosFiltrados();

    updateMedicosKPIs();
    document.getElementById("table-count").innerHTML = `Exibindo <strong>${lista.length}</strong> médico${lista.length !== 1 ? 's' : ''}`;

    if (state.visList === 'tabela') renderTabela(lista);
    else renderCards(lista);
}

function updateMedicosKPIs() {
    const total = medicos.length;
    const ativos = medicos.filter(m => m.status === 'Ativo').length;
    const inativos = medicos.filter(m => m.status === 'Inativo').length;
    
    const elTotal = document.getElementById("kpiMedTotal");
    if(elTotal) {
        elTotal.textContent = total;
        document.getElementById("kpiMedAtivos").textContent = ativos;
        document.getElementById("kpiMedInativos").textContent = inativos;
        document.getElementById("kpiMedNovos").textContent = "+0"; // Track de log futuro
    }
}

function renderTabela(lista) {
    document.getElementById("vis-tabela").classList.remove("hidden");
    document.getElementById("vis-cards").classList.add("hidden");

    const tbody = document.getElementById("medicos-tbody");
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#94A3B8;">Nenhum médico encontrado.</td></tr>`;
        return;
    }

    lista.forEach(m => {
        const cvs = m.convenios.map(id => convenios.find(c => c.id === id)).filter(Boolean);
        const cvTags = cvs.slice(0, 2).map(c =>
            `<span class="convenio-tag">${c.nome}</span>`
        ).join("") + (cvs.length > 2 ? `<span class="convenio-tag extra">+${cvs.length - 2}</span>` : "");

        const pacCount = pacientes.filter(p => p.medicoId === m.id).length;

        const tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        tr.onclick = () => openPerfil(m.id);
        tr.innerHTML = `
            <td>
                <div class="td-flex">
                    <div class="user-avatar" style="background:${avatarBg(m.id)}">${initials(m.nome)}</div>
                    <div>
                        <p class="user-name">${m.nome}</p>
                        <p class="user-sub">ID #${String(m.id).padStart(4,'0')}</p>
                    </div>
                </div>
            </td>
            <td><code style="background:#F1F5F9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;">CRM ${m.crm}</code></td>
            <td><div class="convenio-tags">${cvTags || '<span style="color:#94A3B8;font-size:12px;">—</span>'}</div></td>
            <td style="font-size:13px;font-weight:600;color:#0F172A;">${pacCount}</td>
            <td>${getBadge(m.status)}</td>
            <td style="text-align:right;">
                <button class="btn-icon" title="Ver perfil" onclick="event.stopPropagation();openPerfil(${m.id})">
                    <i data-lucide="eye"></i>
                </button>
                <button class="btn-icon" title="Editar" onclick="event.stopPropagation();openModalEdit(${m.id})" style="margin-left:4px;">
                    <i data-lucide="edit-3"></i>
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function renderCards(lista) {
    document.getElementById("vis-tabela").classList.add("hidden");
    const container = document.getElementById("vis-cards");
    container.classList.remove("hidden");
    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = `<p style="color:#94A3B8;padding:40px;text-align:center;grid-column:1/-1;">Nenhum médico encontrado.</p>`;
        return;
    }

    lista.forEach(m => {
        const pacCount = pacientes.filter(p => p.medicoId === m.id).length;
        const cvCount  = m.convenios.length;
        const card = document.createElement("div");
        card.className = "medico-card";
        card.onclick = () => openPerfil(m.id);
        card.innerHTML = `
            <div class="mc-avatar" style="background:${avatarBg(m.id)}">${initials(m.nome)}</div>
            <p class="mc-nome">${m.nome}</p>
            <p class="mc-crm">CRM ${m.crm}</p>
            ${getBadge(m.status)}
            <div class="mc-stats">
                <div class="mc-stat">
                    <span class="mc-stat-val">${pacCount}</span>
                    <span class="mc-stat-label">Pacientes</span>
                </div>
                <div class="mc-stat">
                    <span class="mc-stat-val">${cvCount}</span>
                    <span class="mc-stat-label">Convênios</span>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

/* ─── Tela 2: Perfil ────────────────────────────────────────── */
function openPerfil(id) {
    state.activeMedicoId = id;
    state.view = 'perfil';
    state.pfTab = 'pacientes';
    renderApp();
    window.scrollTo(0, 0);
}

function goBackToLista() {
    state.view = 'lista';
    state.activeMedicoId = null;
    renderApp();
}

function renderPerfil() {
    const m = medicos.find(x => x.id === state.activeMedicoId);
    if (!m) return goBackToLista();

    const pacList = pacientes.filter(p => p.medicoId === m.id);
    const cvList  = m.convenios.map(id => convenios.find(c => c.id === id)).filter(Boolean);

    // Breadcrumb e header
    document.getElementById("perfil-breadcrumb-nome").textContent = m.nome;

    // Sidebar do perfil
    const avatarEl = document.getElementById("pf-avatar-lg");
    avatarEl.textContent = initials(m.nome);
    avatarEl.style.background = avatarBg(m.id);

    const statusDot = document.getElementById("pf-status-dot");
    statusDot.className = `perfil-avatar-status ${m.status.toLowerCase()}`;

    document.getElementById("pf-nome").textContent     = m.nome;
    document.getElementById("pf-crm").textContent      = `CRM ${m.crm}`;
    document.getElementById("pf-telefone").textContent = m.telefone;
    document.getElementById("pf-email").textContent    = m.email;
    document.getElementById("pf-cidade").textContent   = m.cidade && m.uf ? `${m.cidade} / ${m.uf}` : m.cidade || "—";
    document.getElementById("pf-ingresso").textContent = `Ingresso: ${m.ingresso}`;

    const toggleBtn = document.getElementById("btn-toggle-status-label");
    if (toggleBtn) toggleBtn.textContent = m.status === "Ativo" ? "Desativar" : "Reativar";

    // KPIs
    document.getElementById("pf-kpi-pacientes").textContent = pacList.length;
    document.getElementById("pf-kpi-convenios").textContent = cvList.length;
    document.getElementById("pf-kpi-status").innerHTML     = getBadge(m.status);

    // Convênios vinculados
    const cvContainer = document.getElementById("pf-convenios-list");
    if (cvList.length === 0) {
        cvContainer.innerHTML = `<p class="cv-vinculo-empty">Nenhum convênio vinculado.</p>`;
    } else {
        cvContainer.innerHTML = cvList.map(c => `
            <div class="cv-vinculo-row">
                <div class="cv-vinculo-icon"><i data-lucide="building"></i></div>
                <div>
                    <p class="cv-vinculo-nome">${c.nome}</p>
                    <p class="cv-vinculo-cnpj">${c.cnpj}</p>
                </div>
                ${getBadge(c.status)}
            </div>`).join("");
    }

    // Pacientes / Triagens
    const triList = triagens.filter(t => t.medicoId === m.id);
    document.getElementById("badge-pf-pacientes").textContent = pacList.length;
    document.getElementById("badge-pf-triagens").textContent  = triList.length;

    // Esconde a senha provisória gerada anteriormente ao trocar de médico
    document.getElementById("pf-senha-gerada").classList.add("hidden");

    renderPfTable();
}

function renderPfTable() {
    const m = medicos.find(x => x.id === state.activeMedicoId);
    if (!m) return;

    const thead = document.getElementById("pf-dynamic-thead");
    const tbody = document.getElementById("pf-dynamic-tbody");

    if (state.pfTab === 'triagens') {
        const triList = triagens.filter(t => t.medicoId === m.id)
            .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

        thead.innerHTML = `<tr><th>Paciente</th><th>Data</th><th>Horário</th></tr>`;

        if (triList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:32px;color:#94A3B8;">Nenhuma triagem registrada.</td></tr>`;
        } else {
            tbody.innerHTML = triList.map(t => {
                const p  = pacientes.find(x => x.id === t.pacienteId);
                const dt = new Date(t.dataHora);
                return `<tr>
                    <td>
                        <div class="td-flex">
                            <div class="user-avatar" style="background:${avatarBg(t.pacienteId)}">${p ? initials(p.nome) : "—"}</div>
                            <p class="user-name">${p ? p.nome : "Paciente removido"}</p>
                        </div>
                    </td>
                    <td>${dt.toLocaleDateString('pt-BR')}</td>
                    <td>${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>`;
            }).join("");
        }
        return;
    }

    const pacList = pacientes.filter(p => p.medicoId === m.id);

    thead.innerHTML = `<tr><th>Paciente</th><th>Documento</th><th>Convênios</th><th>Status</th></tr>`;

    if (pacList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:#94A3B8;">Nenhum paciente vinculado.</td></tr>`;
    } else {
        tbody.innerHTML = pacList.map(p => {
            const cvNomes = p.convenios.map(id => convenios.find(c => c.id === id)?.nome).filter(Boolean);
            const cvStr   = cvNomes.length ? cvNomes.map(n => `<span class="convenio-tag">${n}</span>`).join(" ") : "—";
            return `<tr>
                <td>
                    <div class="td-flex">
                        <div class="user-avatar" style="background:${avatarBg(p.id)}">${initials(p.nome)}</div>
                        <div>
                            <p class="user-name">${p.nome}</p>
                            <p class="user-sub">ID #${String(p.id).padStart(4,'0')}</p>
                        </div>
                    </div>
                </td>
                <td><code style="background:#F1F5F9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;">${p.doc}</code></td>
                <td><div class="convenio-tags">${cvStr}</div></td>
                <td>${getBadge(p.status)}</td>
            </tr>`;
        }).join("");
    }
}

/* ─── Tabs do Perfil (Pacientes / Triagens) ─────────────────── */
window.switchPfTab = function(tab) {
    state.pfTab = tab;
    document.getElementById("tab-pf-pacientes").className = `tab ${tab === 'pacientes' ? 'active' : ''}`;
    document.getElementById("tab-pf-triagens").className  = `tab ${tab === 'triagens' ? 'active' : ''}`;
    renderPfTable();
};

/* ─── Reset de Senha (perfil) ───────────────────────────────── */
window.resetarSenhaMedico = async function() {
    const m = medicos.find(x => x.id === state.activeMedicoId);
    if (!m) return;

    if (!confirm(`Gerar uma nova senha provisória para ${m.nome}? A senha atual deixará de funcionar imediatamente.`)) {
        return;
    }

    try {
        const token = localStorage.getItem("aura_token");
        const response = await fetch(`${API_URL}/medicos/${m.id}/resetar-senha`, {
            method: "POST",
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById("pf-senha-gerada-valor").value = data.senha;
            document.getElementById("pf-senha-gerada").classList.remove("hidden");
            lucide.createIcons();
            showToast("Nova senha provisória gerada com sucesso.");
        } else {
            const errData = await response.json();
            showToast(`Erro: ${errData.detail || 'Não foi possível gerar a senha.'}`, "error");
        }
    } catch (err) {
        console.error("Erro ao resetar senha:", err);
        showToast("Erro de conexão.", "error");
    }
};

window.copiarSenhaGerada = function() {
    const input = document.getElementById("pf-senha-gerada-valor");
    navigator.clipboard.writeText(input.value).then(() => {
        showToast("Senha copiada!");
    }).catch(() => {
        input.select();
        document.execCommand("copy");
        showToast("Senha copiada!");
    });
};

/* ─── Toggle Status (perfil) ────────────────────────────────── */
window.toggleStatus = function() {
    const m = medicos.find(x => x.id === state.activeMedicoId);
    if (!m) return;
    m.status = m.status === "Ativo" ? "Inativo" : "Ativo";
    showToast(`${m.nome} marcado como ${m.status}.`);
    renderApp();
};

/* ─── Filtro e Visualização ─────────────────────────────────── */
window.setKpiFilter = function(kpi, btn) {
    state.kpiFilter = kpi;
    document.querySelectorAll(".med-kpi").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    const selStatus = document.getElementById("filterStatus");
    if (kpi === 'Ativo' || kpi === 'Inativo') {
        if(selStatus) selStatus.value = kpi;
        state.statusFilter = kpi;
    } else if (kpi === 'Todos') {
        if(selStatus) selStatus.value = "";
        state.statusFilter = "";
    }
    renderApp();
};

window.setStatusFilter = function(val) {
    state.statusFilter = val;
    renderApp();
};

window.setView = function(vis) {
    state.visList = vis;
    document.getElementById("tab-tabela").className = `tab ${vis === 'tabela' ? 'active' : ''}`;
    document.getElementById("tab-cards").className  = `tab ${vis === 'cards'  ? 'active' : ''}`;
    renderApp();
};

/* ─── Modal Novo / Editar Médico ────────────────────────────── */
function populateModalConvenios(selectedIds) {
    const grid = document.getElementById("m-convenios-list");
    grid.innerHTML = "";
    convenios.forEach(cv => {
        const checked = selectedIds.includes(cv.id);
        const lbl = document.createElement("label");
        lbl.className = `chk-item ${checked ? 'checked' : ''}`;
        lbl.innerHTML = `
            <input type="checkbox" value="${cv.id}" ${checked ? 'checked' : ''} onchange="toggleChk(this)">
            <span>${cv.nome}</span>`;
        grid.appendChild(lbl);
    });
}

window.openModalAdd = function() {
    state.editingId = null;
    document.getElementById("modal-medico-title").textContent = "Novo Médico";
    document.getElementById("modal-medico-sub").textContent   = "Preencha os dados e selecione os convênios vinculados";
    ["medico-nome","medico-cpf","medico-crm","medico-data-nascimento","medico-telefone","medico-email","medico-uf","medico-cidade"].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });

    const statusGroup = document.getElementById("grupo-status-medico");
    if (statusGroup) statusGroup.style.display = "none";

    const senhaGroup = document.getElementById("grupo-senha-medico");
    if (senhaGroup) {
        senhaGroup.style.display = "flex";
        const chars = "!@#$*";
        const special = chars[Math.floor(Math.random() * chars.length)];
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        state.senhaSufixo = `${special}${randomHex}`;
        document.getElementById("medico-senha").value = `Medico${state.senhaSufixo}`;
    }

    populateModalConvenios([]);
    document.getElementById("modal-medico").classList.remove("hidden");
    lucide.createIcons();
};

window.openModalEdit = function(id) {
    const idResolvido = id ?? state.activeMedicoId;
    const m = medicos.find(x => x.id === idResolvido);
    if (!m) return;
    state.editingId = m.id;
    document.getElementById("modal-medico-title").textContent = "Editar Médico";
    document.getElementById("modal-medico-sub").textContent   = `Editando: ${m.nome}`;
    
    document.getElementById("medico-nome").value            = m.nome;
    document.getElementById("medico-cpf").value             = m.cpf || "";
    document.getElementById("medico-crm").value             = (m.crm || "").replace('CRM ', '');
    document.getElementById("medico-data-nascimento").value = m.data_nascimento || "";
    document.getElementById("medico-telefone").value        = m.telefone || "";
    document.getElementById("medico-email").value           = m.email || "";
    document.getElementById("medico-uf").value              = m.uf || "";
    document.getElementById("medico-cidade").value          = m.cidade || "";

    const statusGroup = document.getElementById("grupo-status-medico");
    if (statusGroup) statusGroup.style.display = "block";
    const statusInput = document.getElementById("m-status");
    if (statusInput) statusInput.value = m.status || "Ativo";

    const senhaGroup = document.getElementById("grupo-senha-medico");
    if (senhaGroup) senhaGroup.style.display = "none";

    populateModalConvenios(m.convenios);
    document.getElementById("modal-medico").classList.remove("hidden");
    lucide.createIcons();
};

window.closeModalMedico = function() {
    document.getElementById("modal-medico").classList.add("hidden");
    state.editingId = null;
};

window.saveMedico = async function() {
    const nome = document.getElementById("medico-nome").value.trim();
    const email = document.getElementById("medico-email").value.trim();
    const cpf = document.getElementById("medico-cpf").value.replace(/\D/g, "");
    const crm = document.getElementById("medico-crm").value.trim();
    const telefone = document.getElementById("medico-telefone").value.trim();
    const cidade = document.getElementById("medico-cidade").value.trim();
    const uf = document.getElementById("medico-uf").value.toUpperCase().trim();
    const dataNascimento = document.getElementById("medico-data-nascimento").value;

    if (!nome || !email || !cpf || !dataNascimento) {
        showToast("Preencha todos os campos obrigatórios básicos.", "error");
        return;
    }

    if (!crm || crm.length < 4) {
        showToast("O CRM é obrigatório e deve possuir no mínimo 4 caracteres.", "error");
        return;
    }

    const cbs = Array.from(document.querySelectorAll('#m-convenios-list input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));

    const isEditing = !!state.editingId;

    const payload = {
        nome: nome,
        email: email,
        cpf: cpf,
        crm: crm,
        telefone: telefone || null,
        cidade: cidade || null,
        uf: uf || null,
        data_nascimento: dataNascimento
    };

    // Inclui a senha no payload apenas se for criação de um novo médico
    if (!isEditing) {
        payload.senha = document.getElementById("medico-senha").value;
    }

    try {
        const token = localStorage.getItem("aura_token");
        const url = isEditing ? `${API_URL}/medicos/${state.editingId}` : `${API_URL}/medicos/`;
        const method = isEditing ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast(isEditing ? `Perfil de ${nome} atualizado com sucesso.` : `Médico ${nome} cadastrado com sucesso.`);
            closeModalMedico();
            await carregarDados(); // Recarrega os dados fresquinhos do banco de dados (A API)
        } else {
            const errData = await response.json();
            showToast(`Erro ao salvar: ${errData.detail || 'Verifique os dados'}`, "error");
        }
    } catch (err) {
        console.error("Erro ao salvar médico:", err);
        showToast("Erro de conexão.", "error");
    }
};

window.copiarSenhaMedico = function() {
    const senhaInput = document.getElementById("medico-senha");
    navigator.clipboard.writeText(senhaInput.value).then(() => {
        showToast("Senha provisória copiada!", "success");
    }).catch(() => {
        senhaInput.select();
        document.execCommand("copy");
        showToast("Senha provisória copiada!", "success");
    });
};

/* ─── Modal Gerenciar Convênios (perfil) ────────────────────── */
window.openModalVincular = function() {
    const m = medicos.find(x => x.id === state.activeMedicoId);
    if (!m) return;
    document.getElementById("modal-vincular-sub").textContent = `Convênios de ${m.nome}`;
    const grid = document.getElementById("vincular-convenios-list");
    grid.innerHTML = "";
    convenios.forEach(cv => {
        const checked = m.convenios.includes(cv.id);
        const lbl = document.createElement("label");
        lbl.className = `chk-item ${checked ? 'checked' : ''}`;
        lbl.innerHTML = `
            <input type="checkbox" value="${cv.id}" ${checked ? 'checked' : ''} onchange="toggleChk(this)">
            <span>${cv.nome}</span>`;
        grid.appendChild(lbl);
    });
    document.getElementById("modal-vincular").classList.remove("hidden");
    lucide.createIcons();
};

window.closeModalVincular = function() {
    document.getElementById("modal-vincular").classList.add("hidden");
};

window.saveVincular = function() {
    const m = medicos.find(x => x.id === state.activeMedicoId);
    if (!m) return;
    const cbs = Array.from(document.querySelectorAll('#vincular-convenios-list input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
    m.convenios = cbs;
    closeModalVincular();
    showToast("Vínculos de convênio atualizados.");
    renderApp();
};

/* ─── Exportação CSV ────────────────────────────────────────── */
function downloadCSV(header, rows, filename) {
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? "—").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

window.exportarMedicosCSV = function() {
    const lista = getMedicosFiltrados();
    const header = ["ID", "Nome", "CPF", "CRM", "Telefone", "E-mail", "Cidade", "UF", "Convênios", "Pacientes", "Status"];
    const rows = lista.map(m => {
        const cvNomes  = m.convenios.map(id => convenios.find(c => c.id === id)?.nome).filter(Boolean);
        const pacCount = pacientes.filter(p => p.medicoId === m.id).length;
        return [`#${String(m.id).padStart(4, '0')}`, m.nome, m.cpf, m.crm, m.telefone, m.email, m.cidade, m.uf, cvNomes.join(" | "), pacCount, m.status];
    });
    downloadCSV(header, rows, "medicos_aura.csv");
};

window.exportarPerfilCSV = function() {
    const m = medicos.find(x => x.id === state.activeMedicoId);
    if (!m) return;

    const nomeArquivo = m.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_").toLowerCase();

    if (state.pfTab === 'triagens') {
        const triList = triagens.filter(t => t.medicoId === m.id)
            .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
        const header = ["ID", "Paciente", "Data", "Horário"];
        const rows = triList.map(t => {
            const p  = pacientes.find(x => x.id === t.pacienteId);
            const dt = new Date(t.dataHora);
            return [t.id, p ? p.nome : "Paciente removido", dt.toLocaleDateString('pt-BR'), dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })];
        });
        downloadCSV(header, rows, `triagens_${nomeArquivo}.csv`);
    } else {
        const pacList = pacientes.filter(p => p.medicoId === m.id);
        const header = ["ID", "Nome", "Documento", "Convênios", "Status"];
        const rows = pacList.map(p => {
            const cvNomes = p.convenios.map(id => convenios.find(c => c.id === id)?.nome).filter(Boolean);
            return [`#${String(p.id).padStart(4, '0')}`, p.nome, p.doc, cvNomes.join(" | "), p.status];
        });
        downloadCSV(header, rows, `pacientes_${nomeArquivo}.csv`);
    }
};

/* ─── Helpers ───────────────────────────────────────────────── */
window.toggleChk = function(input) {
    input.parentElement.classList.toggle("checked", input.checked);
};

function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    const msgEl = document.getElementById("toast-msg");
    const icon = document.getElementById("toast-icon");
    
    if (msgEl) msgEl.textContent = msg;
    toast.className = `toast ${type}`;
    
    if (icon) {
        if (type === "success") {
            icon.setAttribute("data-lucide", "check-circle");
            toast.style.background = ""; toast.style.color = ""; toast.style.borderColor = "";
        } else {
            icon.setAttribute("data-lucide", "alert-circle");
            toast.style.background = "#FEF2F2"; toast.style.color = "#DC2626"; toast.style.borderColor = "#FECACA";
        }
        lucide.createIcons();
    }
    
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3500);
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

function setupProfile() {
    const user = JSON.parse(localStorage.getItem("aura_user") || "{}");
    const nomeFull = user.nome || "Admin Principal";
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
}

// Logout
const btnLogout = document.querySelector('.logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        window.location.replace('/login.html');
    });
}

// ==========================================
// LÓGICA DE IBGE, MÁSCARAS E VALIDAÇÕES (NOVO)
// ==========================================

function setupMascarasMedicos() {
    const inputCpf = document.getElementById("medico-cpf");
    const inputTelefone = document.getElementById("medico-telefone");

    if(inputCpf) {
        inputCpf.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.substring(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = v;
        });
    }

    if(inputTelefone) {
        inputTelefone.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.substring(0, 11);
            v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
            v = v.replace(/(\d{4,5})(\d{4})$/, "$1-$2");
            e.target.value = v;
        });
    }
}

async function carregarLocalidades() {
    try {
        const resUf = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
        allStates = await resUf.json();
        const resMun = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios");
        allCities = await resMun.json();
        
        popularDatalistUf();
        popularDatalistCidades(allCities);
    } catch (err) {
        console.error("Erro ao carregar dados do IBGE", err);
    }
}

function popularDatalistUf() {
    const datalist = document.getElementById("lista-ufs");
    if(!datalist) return;
    datalist.innerHTML = "";
    allStates.sort((a, b) => a.sigla.localeCompare(b.sigla)).forEach(uf => {
        const option = document.createElement("option");
        option.value = uf.sigla; option.textContent = uf.nome;
        datalist.appendChild(option);
    });
}

function popularDatalistCidades(cidades) {
    const datalist = document.getElementById("lista-cidades");
    if(!datalist) return;
    datalist.innerHTML = "";
    cidades.forEach(c => {
        const option = document.createElement("option"); option.value = c.nome;
        datalist.appendChild(option);
    });
}

function setupLocalidadesEvents() {
    const inputUf = document.getElementById("medico-uf");
    const inputCidade = document.getElementById("medico-cidade");
    if(!inputUf || !inputCidade) return;

    inputUf.addEventListener("change", (e) => {
        const ufSelecionada = e.target.value.toUpperCase();
        if (ufSelecionada) {
            popularDatalistCidades(allCities.filter(c => c.microrregiao.mesorregiao.UF.sigla === ufSelecionada));
        } else {
            popularDatalistCidades(allCities);
        }
    });

    inputCidade.addEventListener("change", (e) => {
        const cidadeObj = allCities.find(c => c.nome.toLowerCase() === e.target.value.toLowerCase());
        if (cidadeObj) {
            const ufDaCidade = cidadeObj.microrregiao.mesorregiao.UF.sigla;
            inputUf.value = ufDaCidade;
            popularDatalistCidades(allCities.filter(c => c.microrregiao.mesorregiao.UF.sigla === ufDaCidade));
        }
    });
}
