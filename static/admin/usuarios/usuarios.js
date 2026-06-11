/**
 * PLATAFORMA DE ASSISTÊNCIA CLÍNICA - AURA
 * Gestão de Usuários (Mock temporário para visualização de Frontend)
 */

// Mock de usuários até que a API esteja pronta e conectada com o banco
let mockUsuarios = [
    { id: 1, nome: "Admin Principal", email: "admin@admin.com", perfil: "Super Admin", ativo: true },
    { id: 2, nome: "Dra. Ana Silva", email: "ana.silva@clinica.com", perfil: "Médico", ativo: true },
    { id: 3, nome: "Dr. Carlos Mendes", email: "carlos.m@clinica.com", perfil: "Médico", ativo: false },
    { id: 4, nome: "Admin Secundário", email: "admin2@clinica.com", perfil: "Super Admin", ativo: true }
];

document.addEventListener("DOMContentLoaded", () => {
    verificarAcessoSuperUser();
    renderizarTabela();
    
    // Listeners do formulário
    const formUsuario = document.getElementById("form-usuario");
    if (formUsuario) {
        formUsuario.addEventListener("submit", (e) => {
            e.preventDefault();
            salvarNovoUsuario();
        });
    }

    // Listener para o botão de sair na navbar
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.href = "login.html";
        });
    }
});

/**
 * Simula a verificação de permissão. 
 * Apenas super admins devem ter acesso à tela.
 */
function verificarAcessoSuperUser() {
    const userLogadoStr = localStorage.getItem('aura_user');
    if (!userLogadoStr) {
        // Se não estiver logado, envia para o login
        window.location.href = "login.html";
        return;
    }

    try {
        const userLogado = JSON.parse(userLogadoStr);
        // Regra temporária mock: assume que e-mails contendo 'admin' são os super admins
        if (userLogado.email && !userLogado.email.includes("admin")) {
            alert("Acesso Negado: Você não tem permissão para acessar a Gestão de Usuários.");
            window.location.href = "dashboard.html";
        }
    } catch (e) {
        console.error("Erro ao validar usuário logado", e);
    }
}

/**
 * Renderiza os dados do mock na tabela
 */
function renderizarTabela() {
    const tbody = document.getElementById("tabela-usuarios");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    if (mockUsuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhum usuário encontrado.</td></tr>`;
        return;
    }

    mockUsuarios.forEach(user => {
        const tr = document.createElement("tr");
        
        const statusClass = user.ativo ? "status-ativo" : "status-inativo";
        const statusText = user.ativo ? "Ativo" : "Inativo";
        
        // Impede que o admin principal seja desativado visualmente
        const isPrincipal = user.email === "admin@admin.com";
        let actionBtn = "";

        if (isPrincipal) {
            actionBtn = `<span style="color: var(--text-muted); font-size: 0.8rem;">Sistema / Protegido</span>`;
        } else {
            actionBtn = user.ativo 
                ? `<button class="btn-acao btn-desativar" onclick="alternarStatus(${user.id})">Desativar</button>`
                : `<button class="btn-acao btn-ativar" onclick="alternarStatus(${user.id})">Ativar</button>`;
        }

        tr.innerHTML = `
            <td><strong>${user.nome}</strong></td>
            <td>${user.email}</td>
            <td>${user.perfil}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Abre o modal para cadastrar novo usuário
 */
function abrirModalNovoUsuario() {
    document.getElementById("form-usuario").reset();
    document.getElementById("modal-usuario").removeAttribute("hidden");
}

/**
 * Fecha o modal
 */
function fecharModalNovoUsuario() {
    document.getElementById("modal-usuario").setAttribute("hidden", "true");
}

/**
 * Salva os dados do formulário no array mock e recarrega a tabela visualmente.
 */
function salvarNovoUsuario() {
    const nome = document.getElementById("nome-usuario").value.trim();
    const email = document.getElementById("email-usuario").value.trim();
    const perfilValue = document.getElementById("perfil-usuario").value;
    
    const perfil = perfilValue === 'admin' ? "Super Admin" : "Médico";

    // Verifica se já existe um usuário com esse email (no mock)
    if (mockUsuarios.find(u => u.email === email)) {
        alert("Já existe um usuário cadastrado com este e-mail.");
        return;
    }

    const novoId = mockUsuarios.length > 0 ? Math.max(...mockUsuarios.map(u => u.id)) + 1 : 1;

    mockUsuarios.push({
        id: novoId,
        nome: nome,
        email: email,
        perfil: perfil,
        ativo: true
    });

    fecharModalNovoUsuario();
    renderizarTabela();
    
    alert(`Usuário ${nome} criado com sucesso (Modo Mock)!`);
}

/**
 * Altera o status (Ativo/Inativo) de um usuário específico
 */
function alternarStatus(id) {
    const usuario = mockUsuarios.find(u => u.id === id);
    if (usuario) {
        if (usuario.email === "admin@admin.com") {
            alert("Operação negada: O Super Admin principal não pode ser alterado.");
            return;
        }
        
        usuario.ativo = !usuario.ativo;
        renderizarTabela();
    }
}