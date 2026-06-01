/* ─── Configuração da API ──────────────────────────────────── */
const API_URL = "http://localhost:8000/api";

/* ─── Dados (preenchidos pela API) ─────────────────────────── */
let medicos    = [];
let convenios  = [];
let pacientes  = [];

/* ─── Estado da UI ─────────────────────────────────────────── */
let state = {
    view: 'lista',          // 'lista' | 'perfil'
    activeMedicoId: null,
    visList: 'tabela',      // 'tabela' | 'cards'
    filter: 'todos',        // 'todos' | 'Ativo' | 'Inativo'
    searchQuery: '',
    editingId: null         // id do médico sendo editado no modal
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

        const [resMed, resGrupos, resPac] = await Promise.all([
            fetch(`${API_URL}/medicos/`,   opts),
            fetch(`${API_URL}/grupos/`,    opts),
            fetch(`${API_URL}/pacientes/`, opts)
        ]);

        if ([resMed, resGrupos, resPac].some(r => r.status === 401)) {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/static/login.html');
            return;
        }

        const dbMed    = await resMed.json();
        const dbGrupos = await resGrupos.json();
        const dbPac    = await resPac.json();

        convenios = dbGrupos.map(g => ({ id: g.id, nome: g.nome, cnpj: "00.000.000/0000-00", status: g.status || "Ativo" }));

        medicos = dbMed.map(m => ({
            id:           m.id,
            nome:         m.nome,
            crm:          `CRM ${m.crm}`,
            especialidade: m.especialidade || "—",
            telefone:     m.telefone   || "—",
            email:        m.email      || "—",
            cidade:       m.cidade     || "—",
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
        { id: 1, nome: "Dr. Carlos Mendes",   crm: "CRM/PR 12345", especialidade: "Clínica Geral",  telefone: "(41) 99100-0001", email: "carlos.mendes@ibk.med.br",   cidade: "Curitiba / PR", ingresso: "Mar 2021", status: "Ativo",   convenios: [1, 2] },
        { id: 2, nome: "Dra. Ana Ferreira",   crm: "CRM/PR 22890", especialidade: "Pediatria",      telefone: "(41) 99100-0002", email: "ana.ferreira@ibk.med.br",    cidade: "Curitiba / PR", ingresso: "Jun 2020", status: "Ativo",   convenios: [1, 3] },
        { id: 3, nome: "Dr. Roberto Lima",    crm: "CRM/PR 33401", especialidade: "Cardiologia",    telefone: "(41) 99100-0003", email: "roberto.lima@ibk.med.br",    cidade: "São José / SC", ingresso: "Jan 2022", status: "Ativo",   convenios: [2]    },
        { id: 4, nome: "Dra. Juliana Costa",  crm: "CRM/PR 44102", especialidade: "Psiquiatria",    telefone: "(41) 99100-0004", email: "juliana.costa@ibk.med.br",   cidade: "Curitiba / PR", ingresso: "Set 2019", status: "Ativo",   convenios: [1, 4] },
        { id: 5, nome: "Dr. Marcos Oliveira", crm: "CRM/SP 55230", especialidade: "Neurologia",     telefone: "(11) 99100-0005", email: "marcos.oliveira@ibk.med.br", cidade: "São Paulo / SP", ingresso: "Fev 2023", status: "Inativo", convenios: [3]    },
        { id: 6, nome: "Dra. Fernanda Rocha", crm: "CRM/PR 66781", especialidade: "Dermatologia",   telefone: "(41) 99100-0006", email: "fernanda.rocha@ibk.med.br",  cidade: "Curitiba / PR", ingresso: "Out 2022", status: "Ativo",   convenios: [1, 2, 3] },
        { id: 7, nome: "Dr. Paulo Souza",     crm: "CRM/PR 77002", especialidade: "Ortopedia",      telefone: "(41) 99100-0007", email: "paulo.souza@ibk.med.br",     cidade: "Londrina / PR", ingresso: "Jul 2021", status: "Ativo",   convenios: [2, 4] },
        { id: 8, nome: "Dra. Camila Nunes",   crm: "CRM/RS 88543", especialidade: "Endocrinologia", telefone: "(51) 99100-0008", email: "camila.nunes@ibk.med.br",    cidade: "Porto Alegre / RS", ingresso: "Abr 2020", status: "Ativo", convenios: [1]  },
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
    renderApp();
}

/* ─── Inicialização ─────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    document.getElementById("current-date").textContent = today;

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
function renderLista() {
    let lista = medicos;

    // Filtro status
    if (state.filter !== 'todos') lista = lista.filter(m => m.status === state.filter);

    // Busca
    if (state.searchQuery) {
        lista = lista.filter(m =>
            m.nome.toLowerCase().includes(state.searchQuery) ||
            m.crm.toLowerCase().includes(state.searchQuery) ||
            m.especialidade.toLowerCase().includes(state.searchQuery)
        );
    }

    const ativos   = medicos.filter(m => m.status === 'Ativo').length;
    const inativos = medicos.filter(m => m.status === 'Inativo').length;
    document.getElementById("stats-medicos").textContent =
        `${medicos.length} médicos · ${ativos} ativos · ${inativos} inativos`;
    document.getElementById("table-count").textContent = `${lista.length} médico${lista.length !== 1 ? 's' : ''}`;

    if (state.visList === 'tabela') renderTabela(lista);
    else renderCards(lista);
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
            <td><code style="background:#F1F5F9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;">${m.crm}</code></td>
            <td style="font-size:12px;color:#374151;">${m.especialidade}</td>
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
            <p class="mc-crm">${m.crm}</p>
            <span class="mc-esp">${m.especialidade}</span>
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
    document.getElementById("pf-crm").textContent      = m.crm;
    document.getElementById("pf-esp").textContent       = m.especialidade;
    document.getElementById("pf-telefone").textContent = m.telefone;
    document.getElementById("pf-email").textContent    = m.email;
    document.getElementById("pf-cidade").textContent   = m.cidade;
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

    // Pacientes
    document.getElementById("badge-pf-pacientes").textContent = pacList.length;
    const tbody = document.getElementById("pf-pacientes-tbody");
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

/* ─── Toggle Status (perfil) ────────────────────────────────── */
window.toggleStatus = function() {
    const m = medicos.find(x => x.id === state.activeMedicoId);
    if (!m) return;
    m.status = m.status === "Ativo" ? "Inativo" : "Ativo";
    showToast(`${m.nome} marcado como ${m.status}.`);
    renderApp();
};

/* ─── Filtro e Visualização ─────────────────────────────────── */
window.setFilter = function(filter, btn) {
    state.filter = filter;
    document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
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
    ["m-nome","m-crm","m-especialidade","m-telefone","m-email","m-cidade"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("m-status").value = "Ativo";
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
    document.getElementById("m-nome").value          = m.nome;
    document.getElementById("m-crm").value           = m.crm;
    document.getElementById("m-especialidade").value = m.especialidade;
    document.getElementById("m-telefone").value      = m.telefone;
    document.getElementById("m-email").value         = m.email;
    document.getElementById("m-cidade").value        = m.cidade;
    document.getElementById("m-status").value        = m.status;
    populateModalConvenios(m.convenios);
    document.getElementById("modal-medico").classList.remove("hidden");
    lucide.createIcons();
};

window.closeModalMedico = function() {
    document.getElementById("modal-medico").classList.add("hidden");
    state.editingId = null;
};

window.saveMedico = function() {
    const nome          = document.getElementById("m-nome").value.trim();
    const crm           = document.getElementById("m-crm").value.trim();
    const especialidade = document.getElementById("m-especialidade").value.trim();

    if (!nome || !crm || !especialidade) {
        showToast("Preencha os campos obrigatórios (*).", "error");
        return;
    }

    const cbs = Array.from(document.querySelectorAll('#m-convenios-list input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));

    if (state.editingId) {
        const idx = medicos.findIndex(x => x.id === state.editingId);
        if (idx !== -1) {
            medicos[idx] = { ...medicos[idx],
                nome, crm, especialidade,
                telefone:     document.getElementById("m-telefone").value,
                email:        document.getElementById("m-email").value,
                cidade:       document.getElementById("m-cidade").value,
                status:       document.getElementById("m-status").value,
                convenios:    cbs
            };
        }
        showToast(`Perfil de ${nome} atualizado com sucesso.`);
    } else {
        const novoId = Math.max(...medicos.map(m => m.id), 0) + 1;
        medicos.push({
            id: novoId, nome, crm, especialidade,
            telefone:  document.getElementById("m-telefone").value,
            email:     document.getElementById("m-email").value,
            cidade:    document.getElementById("m-cidade").value,
            ingresso:  new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
            status:    document.getElementById("m-status").value,
            convenios: cbs
        });
        showToast(`Médico ${nome} cadastrado com sucesso.`);
    }

    closeModalMedico();
    renderApp();
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

/* ─── Helpers ───────────────────────────────────────────────── */
window.toggleChk = function(input) {
    input.parentElement.classList.toggle("checked", input.checked);
};

function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    document.getElementById("toast-msg").textContent = msg;
    toast.className = `toast ${type}`;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3500);
}

// Logout
const btnLogout = document.querySelector('.logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        window.location.replace('/static/login.html');
    });
}
