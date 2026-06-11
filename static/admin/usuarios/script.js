const API_URL = "/api/admins"; // Rota preparada para a API de Admins
let usuarios = [];
let state = {
    view: 'lista',
    activeUsuarioId: null,
    kpiFilter: 'Todos',
    statusFilter: '',
    searchQuery: ''
};
let usuariosFiltrados = [];

document.addEventListener("DOMContentLoaded", () => {
    setupDate();
    setupSidebar();
    setupProfile();
    setupNotificacoes();
    
    document.getElementById("search-input").addEventListener("input", e => {
        state.searchQuery = e.target.value.toLowerCase();
        renderTabela();
    });

    document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            document.getElementById("search-input").focus();
        }
    });

    const currentUser = JSON.parse(localStorage.getItem('aura_user') || '{}');
    if (!currentUser.is_superadmin) {
        const btnNovoAdmin = document.getElementById("btn-novo-admin");
        if (btnNovoAdmin) btnNovoAdmin.style.display = 'none';
    }

    carregarUsuarios();
    lucide.createIcons();
});

async function carregarUsuarios() {
    try {
        const token = localStorage.getItem('aura_token');
        const res = await fetch(`${API_URL}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            window.location.replace('/login.html');
            return;
        }

        if (res.ok) {
            usuarios = await res.json();
            renderTabela();
        } else {
            throw new Error("Erro na API");
        }
    } catch (err) {
        console.log("Servidor não suporta API de Admins ainda. Usando dados locais...");
        usarDadosDemostracao();
    }
}

function usarDadosDemostracao() {
    usuarios = [
        { id: 1, nome: "Admin Principal", email: "admin@admin.com", status: "Ativo", cargo: "Super Administrador", is_superadmin: true },
        { id: 2, nome: "João Silva", email: "joao@ibk.org.br", status: "Ativo", cargo: "Atendimento", is_superadmin: false },
        { id: 3, nome: "Maria Souza", email: "maria@ibk.org.br", status: "Inativo", cargo: "Analista Clínico", is_superadmin: false }
    ];
    renderTabela();
}

function renderTabela() {
    const tbody = document.getElementById("usuarios-tbody");
    tbody.innerHTML = "";
    
    let ativos = 0;
    let inativos = 0;

    // Calcular KPIs com a lista original
    usuarios.forEach(u => {
        if (u.status === "Ativo") ativos++;
        else inativos++;
    });

    let lista = usuarios;

    if (state.kpiFilter === 'Ativo' || state.kpiFilter === 'Inativo') {
        lista = lista.filter(u => u.status === state.kpiFilter);
    }
    if (state.statusFilter) {
        lista = lista.filter(u => u.status === state.statusFilter);
    }
    if (state.searchQuery) {
        lista = lista.filter(u => u.nome.toLowerCase().includes(state.searchQuery) || u.email.toLowerCase().includes(state.searchQuery));
    }
    usuariosFiltrados = lista;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:#94A3B8;">Nenhum administrador encontrado.</td></tr>`;
    } else {
        lista.forEach(u => {
            const iniciais = u.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
            const badgeClass = u.status === "Ativo" ? "ativo" : "inativo";
            
            const superAdminBadge = u.is_superadmin ? `<span style="display:inline-flex; align-items:center; justify-content:center; width: 18px; height: 18px; background:#F5F3FF; color:#7C3AED; border-radius:4px; margin-left:6px;" title="Super Admin"><i data-lucide="star" style="width:11px; height:11px;"></i></span>` : '';
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 8px; background: #E0F2FE; color: #0369A1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;">${iniciais}</div>
                        <div>
                            <p style="font-size: 13px; font-weight: 600; color: #0F172A; margin: 0; display:flex; align-items:center;">${u.nome}${superAdminBadge}</p>
                            <p style="font-size: 11px; color: #94A3B8; margin: 0; font-family: monospace;">ID #${String(u.id).padStart(4, '0')}</p>
                        </div>
                    </div>
                </td>
                <td style="font-size: 13px; color: #374151;">${u.cargo || 'Administrador'}</td>
                <td style="font-size: 13px; color: #374151;">${u.email}</td>
                <td>
                    <span class="status-badge ${badgeClass}">
                        <div class="dot"></div> ${u.status}
                    </span>
                </td>
                <td style="text-align: right;">
                    <button class="btn-icon" title="Ver perfil" onclick="openPerfil(${u.id})">
                        <i data-lucide="eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById("kpi-total").textContent = usuarios.length;
    document.getElementById("kpi-ativos").textContent = ativos;
    document.getElementById("kpi-inativos").textContent = inativos;
    
    const tableCount = document.getElementById("table-count");
    if (tableCount) tableCount.innerHTML = `Exibindo <strong>${lista.length}</strong> admins`;

    lucide.createIcons();
}

window.setKpiFilter = function(kpi, btn) {
    state.kpiFilter = kpi;
    document.querySelectorAll(".usr-kpi").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    const selStatus = document.getElementById("filterStatus");
    if (kpi === 'Ativo' || kpi === 'Inativo') {
        if(selStatus) selStatus.value = kpi;
        state.statusFilter = kpi;
    } else if (kpi === 'Todos') {
        if(selStatus) selStatus.value = "";
        state.statusFilter = "";
    }
    renderTabela();
};

window.setStatusFilter = function(val) {
    state.statusFilter = val;
    renderTabela();
};

function renderApp() {
    const vLista = document.getElementById("view-lista");
    const vPerfil = document.getElementById("view-perfil");

    if (state.view === 'lista') {
        vLista.classList.remove("hidden");
        vPerfil.classList.add("hidden");
        renderTabela();
    } else {
        vLista.classList.add("hidden");
        vPerfil.classList.remove("hidden");
        renderPerfil();
    }
    lucide.createIcons();
}

window.openPerfil = function(id) {
    state.activeUsuarioId = id;
    state.view = 'perfil';
    renderApp();
    window.scrollTo(0, 0);
};

window.goBackToLista = function() {
    state.view = 'lista';
    state.activeUsuarioId = null;
    renderApp();
};

function renderPerfil() {
    const u = usuarios.find(x => x.id === state.activeUsuarioId);
    if (!u) return goBackToLista();

    document.getElementById("perfil-breadcrumb-nome").textContent = u.nome;

    const iniciais = u.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
    const avatarEl = document.getElementById("pf-avatar-lg");
    avatarEl.textContent = iniciais;
    avatarEl.style.background = "#E0F2FE";
    avatarEl.style.color = "#0369A1";

    const statusDot = document.getElementById("pf-status-dot");
    statusDot.className = `perfil-avatar-status ${u.status === "Ativo" ? "ativo" : "inativo"}`;

    document.getElementById("pf-nome").textContent = u.nome;
    document.getElementById("pf-email").textContent = u.email;
    document.getElementById("pf-data-criacao").textContent = `Criado em: 10/05/2026`; 
    document.getElementById("pf-cargo").textContent = u.cargo || "Administrador";
    
    const badgeSuper = document.getElementById("pf-superadmin-badge");
    if (badgeSuper) badgeSuper.style.display = u.is_superadmin ? "flex" : "none";
    
    document.getElementById("pf-kpi-id").textContent = `#${String(u.id).padStart(4, '0')}`;
    
    const badgeClass = u.status === "Ativo" ? "ativo" : "inativo";
    document.getElementById("pf-kpi-status").innerHTML = `<span class="status-badge ${badgeClass}"><div class="dot"></div> ${u.status}</span>`;

    const toggleBtn = document.getElementById("btn-toggle-status-label");
    const editBtn = document.getElementById("btn-editar-admin");
    if(toggleBtn) {
        const parentBtn = toggleBtn.parentElement;
        const currentUser = JSON.parse(localStorage.getItem('aura_user') || '{}');
        const isSelf = u.email === currentUser.email;
        
        if (!currentUser.is_superadmin) {
            if(parentBtn) parentBtn.style.display = 'none';
            if(editBtn) editBtn.style.display = 'none';
        } else {
            if(editBtn) editBtn.style.display = 'flex';
            
            if (isSelf) {
                if(parentBtn) parentBtn.style.display = 'none';
            } else {
                if(parentBtn) parentBtn.style.display = 'flex';
            if (u.status === "Ativo") {
                toggleBtn.textContent = "Desativar";
                parentBtn.style.color = "#DC2626";
                parentBtn.style.borderColor = "#FECACA";
                parentBtn.style.background = "#FEF2F2";
                parentBtn.innerHTML = `<i data-lucide="power"></i> <span id="btn-toggle-status-label">Desativar</span>`;
            } else {
                toggleBtn.textContent = "Reativar";
                parentBtn.style.color = "#15803D";
                parentBtn.style.borderColor = "#BBF7D0";
                parentBtn.style.background = "#F0FDF4";
                parentBtn.innerHTML = `<i data-lucide="check-circle"></i> <span id="btn-toggle-status-label">Reativar</span>`;
            }
        }
        }
    }
    
    carregarLogsUsuario(u.id);
}

window.toggleStatusPerfil = async function() {
    const u = usuarios.find(x => x.id === state.activeUsuarioId);
    if (!u) return;
    
    const acao = u.status === "Ativo" ? "desativar" : "reativar";
    if (confirm(`Deseja realmente ${acao} o administrador ${u.nome}?`)) {
        try {
            const token = localStorage.getItem('aura_token');
            const res = await fetch(`${API_URL}/${u.id}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const adminAtualizado = await res.json();
                u.status = adminAtualizado.status;
                showToast(`Administrador ${u.status === "Ativo" ? "reativado" : "desativado"} com sucesso.`);
                renderPerfil();
            } else {
                showToast("Erro ao alterar o status do administrador.", "error");
            }
        } catch (error) {
            showToast("Erro de comunicação com o servidor.", "error");
        }
    }
};

let editingAdminId = null;

function openModalAddUsuario() {
    editingAdminId = null;
    document.querySelector("#modal-usuario h2").textContent = "Novo Administrador";
    document.querySelector("#modal-usuario p").textContent = "Crie uma credencial de acesso ao painel AURA.";
    
    document.getElementById("usuario-nome").value = "";
    document.getElementById("usuario-sobrenome").value = "";
    document.getElementById("usuario-email").value = "";
    document.getElementById("usuario-cargo").value = "";
    
    const cbSuper = document.getElementById("usuario-superadmin");
    cbSuper.checked = false;
    cbSuper.disabled = false;
    cbSuper.title = "";
    
    const chars = "!@#$*";
    const special = chars[Math.floor(Math.random() * chars.length)];
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedPassword = `Admin${special}${randomHex}`;
    
    document.getElementById("usuario-senha").value = generatedPassword;
    document.getElementById("usuario-senha-group").style.display = "block";
    document.getElementById("btn-salvar-admin").innerHTML = `<i data-lucide="save" style="width: 16px; height: 16px;"></i> Criar Administrador`;
    
    document.getElementById("modal-usuario").classList.remove("hidden");
    document.getElementById("modal-usuario").style.display = "flex";
    lucide.createIcons();
}

window.openModalEditUsuario = function() {
    const u = usuarios.find(x => x.id === state.activeUsuarioId);
    if (!u) return;

    const currentUser = JSON.parse(localStorage.getItem('aura_user') || '{}');
    const isSelf = u.email === currentUser.email;

    editingAdminId = u.id;
    document.querySelector("#modal-usuario h2").textContent = "Editar Administrador";
    document.querySelector("#modal-usuario p").textContent = "Altere o cargo ou os privilégios deste administrador.";
    
    const nameParts = u.nome.split(' ');
    document.getElementById("usuario-nome").value = nameParts.slice(0, -1).join(' ') || u.nome;
    document.getElementById("usuario-sobrenome").value = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    document.getElementById("usuario-email").value = u.email;
    document.getElementById("usuario-cargo").value = u.cargo;
    
    const cbSuper = document.getElementById("usuario-superadmin");
    cbSuper.checked = u.is_superadmin;
    
    if (isSelf && u.is_superadmin) {
        cbSuper.disabled = true;
        cbSuper.title = "Você não pode remover seu próprio privilégio de Super Admin.";
    } else {
        cbSuper.disabled = false;
        cbSuper.title = "";
    }
    
    document.getElementById("usuario-senha-group").style.display = "none";
    document.getElementById("btn-salvar-admin").innerHTML = `<i data-lucide="save" style="width: 16px; height: 16px;"></i> Salvar Alterações`;
    
    document.getElementById("modal-usuario").classList.remove("hidden");
    document.getElementById("modal-usuario").style.display = "flex";
    lucide.createIcons();
};

function closeModalUsuario() {
    document.getElementById("modal-usuario").classList.add("hidden");
    document.getElementById("modal-usuario").style.display = "none";
}

function copiarSenhaUsuario() {
    const senhaInput = document.getElementById("usuario-senha");
    navigator.clipboard.writeText(senhaInput.value).then(() => {
        showToast("Senha provisória copiada!");
    }).catch(() => {
        senhaInput.select();
        document.execCommand("copy");
        showToast("Senha provisória copiada!");
    });
}

async function saveUsuario() {
    const nome = document.getElementById("usuario-nome").value.trim();
    const sobrenome = document.getElementById("usuario-sobrenome").value.trim();
    const email = document.getElementById("usuario-email").value.trim();
    const senha = document.getElementById("usuario-senha").value;
    const cargo = document.getElementById("usuario-cargo").value.trim() || "Administrador";
    const is_superadmin = document.getElementById("usuario-superadmin").checked; // O JS lê o valor mesmo desabilitado (disabled)

    if (!nome || !sobrenome || !email) {
        showToast("Preencha todos os campos obrigatórios.", "error");
        return;
    }

    try {
        const token = localStorage.getItem('aura_token');
        const url = editingAdminId ? `${API_URL}/${editingAdminId}` : `${API_URL}/`;
        const method = editingAdminId ? 'PUT' : 'POST';
        
        const body = { nome: `${nome} ${sobrenome}`, email: email, cargo: cargo, is_superadmin: is_superadmin };
        if (!editingAdminId) body.senha = senha;

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        
        if (res.ok) {
            showToast(editingAdminId ? "Administrador atualizado!" : "Administrador criado com sucesso!");
            closeModalUsuario();
            carregarUsuarios(); // Recarrega os dados diretamente do backend
            
            // Se editou a si mesmo, atualiza localmente
            const currentUser = JSON.parse(localStorage.getItem('aura_user') || '{}');
            if (editingAdminId && currentUser.email === email) {
                currentUser.nome = `${nome} ${sobrenome}`;
                currentUser.cargo = cargo;
                currentUser.is_superadmin = is_superadmin;
                localStorage.setItem('aura_user', JSON.stringify(currentUser));
                setupProfile();
            }
            
            if (editingAdminId) renderPerfil();
        } else {
            const errorData = await res.json();
            showToast(errorData.detail || "Erro ao criar administrador.", "error");
        }
    } catch (error) {
        showToast("Erro de conexão com o servidor.", "error");
    }
}

// ==========================================
// EXPORTAÇÃO E MODAL DE PREVIEW
// ==========================================
function getDataHoraAtual() {
    const now = new Date(); return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
}

function exportarCSV() {
    const header = ["ID", "Nome", "Cargo", "E-mail", "Status", "Perfil"];
    const rows = usuariosFiltrados.map(u => [u.id, u.nome, u.cargo || 'Administrador', u.email, u.status, u.is_superadmin ? "Super Admin" : "Admin"]);
    const metadata = `"Relatório de Administradores - Instituto Buko Kaesemodel"\n"Baixado em: ${getDataHoraAtual()}"\n\n`;
    const csv = metadata + [header, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `admins_aura_${new Date().getTime()}.csv`; a.click();
    URL.revokeObjectURL(url);
}

function exportarPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) return showToast("Erro: Biblioteca PDF não carregada.", "error");
    const { jsPDF } = window.jspdf; const doc = new jsPDF('landscape');
    doc.setFontSize(14); doc.text("Relatório de Administradores - Instituto Buko Kaesemodel", 14, 15);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Baixado em: ${getDataHoraAtual()}`, 14, 22);
    const rows = usuariosFiltrados.map(u => [u.id, u.nome, u.cargo || 'Administrador', u.email, u.status]);
    doc.autoTable({ head: [["ID", "Nome", "Cargo", "E-mail", "Status"]], body: rows, startY: 28, styles: { fontSize: 9 }, headStyles: { fillColor: [13, 27, 53] } });
    doc.save(`admins_aura_${new Date().getTime()}.pdf`);
}

function setupExportModal() {
    const btnModal = document.getElementById("btnExportModal");
    const overlay = document.getElementById("modalExportOverlay");
    if (!btnModal || !overlay) return;
    let fmt = 'pdf';
    function fechar() { overlay.style.display = "none"; document.body.style.overflow = ""; }
    function preview() {
        const am = usuariosFiltrados.slice(0, 5);
        const area = document.getElementById("exportLivePreview");
        if (fmt === 'pdf') {
            area.className = "export-live-preview";
            let html = `<div class="preview-doc-title">Relatório de Administradores</div><div style="text-align:center; font-size:10px; color:#64748B; margin-bottom: 14px; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px;">Baixado em: ${getDataHoraAtual()}</div>`;
            html += `<table class="preview-doc-table"><thead><tr><th>ID</th><th>Nome</th><th>Cargo</th><th>Status</th></tr></thead><tbody>`;
            if (am.length === 0) html += `<tr><td colspan="4" style="text-align:center; color:#94A3B8;">Nenhum dado</td></tr>`;
            else { am.forEach(u => { html += `<tr><td>#${u.id}</td><td>${u.nome}</td><td>${u.cargo || 'Administrador'}</td><td>${u.status}</td></tr>`; });
            if (usuariosFiltrados.length > 5) html += `<tr><td colspan="4" style="text-align:center; color:#94A3B8;">... e mais ${usuariosFiltrados.length - 5} admins</td></tr>`; }
            area.innerHTML = html + `</tbody></table>`;
        } else {
            area.className = "export-live-preview csv-mode";
            let txt = `"Relatório de Administradores - IBK"\n"Baixado em: ${getDataHoraAtual()}"\n\nID,Nome,Cargo,E-mail,Status\n`;
            am.forEach(u => { txt += `"${u.id}","${u.nome}","${u.cargo || 'Administrador'}","${u.email}","${u.status}"\n`; });
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
async function carregarLogsUsuario(adminId) {
    const container = document.getElementById("pf-user-logs");
    if (!container) return;
    
    container.innerHTML = `<p style="text-align:center; padding: 24px; color: #94A3B8; font-size: 13px;">Carregando atividades...</p>`;

    try {
        const token = localStorage.getItem('aura_token');
        const res = await fetch(`/api/logs/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const logs = await res.json();
            // Filtra pelo id do admin atual e exibe apenas os 5 mais recentes
            const userLogs = logs.filter(l => l.ator_id === adminId && l.tipo_ator === "admin_sistema")
                                 .sort((a,b) => new Date(b.data_hora) - new Date(a.data_hora))
                                 .slice(0, 5);

            if (userLogs.length === 0) {
                container.innerHTML = `
                    <div style="padding: 24px; text-align: center; color: #94A3B8;">
                        <i data-lucide="info" style="width: 32px; height: 32px; opacity: 0.5; margin-bottom: 10px;"></i>
                        <p style="font-size: 13px;">Nenhuma atividade recente encontrada para este usuário.</p>
                    </div>`;
            } else {
                container.innerHTML = `<div class="activity-list" style="padding: 0 16px 16px;">` + userLogs.map(l => {
                    const d = new Date(l.data_hora);
                    const dataStr = d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'});
                    return `
                        <div style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; color: #64748B; flex-shrink: 0;"><i data-lucide="file-text" style="width: 16px; height: 16px;"></i></div>
                            <div>
                                <p style="font-size: 13px; font-weight: 600; color: #1E293B; margin: 0;">${l.acao_realizada} <span style="font-weight: 400; color: #64748B;">em</span> ${l.tabela_afetada}</p>
                                <p style="font-size: 11.5px; color: #64748B; margin: 2px 0 0;">${l.detalhe}</p>
                                <p style="font-size: 10px; color: #94A3B8; margin: 4px 0 0; font-family: monospace;">${dataStr} · IP: ${l.ip_origem || 'N/A'}</p>
                            </div>
                        </div>`;
                }).join('') + `</div>`;
            }
            lucide.createIcons();
        } else {
            container.innerHTML = `<p style="text-align:center; padding: 24px; color: #DC2626; font-size: 13px;">Erro ao carregar os logs do servidor.</p>`;
        }
    } catch (e) {
        container.innerHTML = `<p style="text-align:center; padding: 24px; color: #DC2626; font-size: 13px;">Erro de conexão com a API.</p>`;
    }
}

// --- Utilitários Globais ---
function setupDate() { const d = document.getElementById("current-date"); if(d) d.textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
function setupSidebar() { const b = document.getElementById("sidebarToggle"), s = document.getElementById("sidebar"), i = document.getElementById("toggleIcon"); if(b) b.addEventListener("click", () => { s.classList.toggle("collapsed"); if(i) { i.setAttribute("data-lucide", s.classList.contains("collapsed") ? "panel-left-open" : "menu"); lucide.createIcons(); } }); const l = document.querySelector('.logout'); if(l) l.addEventListener('click', () => { localStorage.removeItem('aura_token'); localStorage.removeItem('aura_user'); window.location.replace('/login.html'); }); }
function setupProfile() { const u = JSON.parse(localStorage.getItem("aura_user") || "{}"), n = u.nome || "Admin Principal", c = u.cargo || "Administrador", i = n.split(" ").slice(0, 2).map(x => x[0]).join("").toUpperCase() || "AD"; ["profileName", "topbarName"].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = n; }); ["profileAvatar", "topbarAvatar"].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = i; }); document.querySelectorAll('.profile-role').forEach(el => el.textContent = `${c} · IBK`); }
function showToast(m, t = "success") { const ts = document.getElementById("toast"), ms = document.getElementById("toast-msg"), ic = document.getElementById("toast-icon"); ts.className = `toast ${t}`; ms.textContent = m; ic.setAttribute("data-lucide", t === "success" ? "check-circle" : "alert-circle"); ts.style.display = "flex"; ts.classList.remove("hidden"); lucide.createIcons(); setTimeout(() => { ts.classList.add("hidden"); ts.style.display = "none"; }, 3500); }

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