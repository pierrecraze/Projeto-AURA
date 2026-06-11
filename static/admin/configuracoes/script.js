const API_URL = "http://localhost:8000/api/auth";

document.addEventListener("DOMContentLoaded", () => {
    // Carrega os ícones primeiro para garantir a renderização visual da tela
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const dateEl = document.getElementById("current-date");
    if (dateEl) dateEl.textContent = today;

    setupSidebar();
    setupTabs();
    loadProfileData();
    setupForms();

    if (typeof lucide !== 'undefined') lucide.createIcons();
});

function setupSidebar() {
    const sidebar = document.getElementById("sidebar");
    const btnToggle = document.getElementById("sidebarToggle");
    if (btnToggle) {
        btnToggle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            const icon = document.getElementById("toggleIcon");
            icon.setAttribute("data-lucide", sidebar.classList.contains("collapsed") ? "panel-left-open" : "menu");
            lucide.createIcons();
        });
    }

    const btnLogout = document.querySelector('.logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/login.html');
        });
    }
}

function loadProfileData() {
    let user = {};
    try {
        const stored = localStorage.getItem("aura_user");
        // Previne o erro fatal se o navegador tiver salvado "undefined" acidentalmente
        if (stored && stored !== "undefined") {
            user = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Erro no cache do usuário:", e);
    }

    const nomeFull = user.nome || "Admin Principal";
    const email = user.email || "admin@admin.com";
    
    const nameParts = nomeFull.trim().split(" ");
    const nomeExibicao = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : nomeFull;
    const iniciais = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase() : nomeFull.substring(0, 2).toUpperCase() || "AD";

    const pName = document.getElementById("profileName");
    if (pName) pName.textContent = nomeExibicao;
    
    const pAvatar = document.getElementById("profileAvatar");
    const aPreview = document.getElementById("avatarPreview");
    
    [pAvatar, aPreview].forEach(el => {
        if (el) {
            el.textContent = iniciais;
            el.style.backgroundColor = "#1E40AF";
            el.style.color = "#ffffff";
        }
    });

    const iNome = document.getElementById("inputNome");
    if (iNome) iNome.value = nomeFull;

    const iEmail = document.getElementById("inputEmail");
    if (iEmail) iEmail.value = email;
}

function setupTabs() {
    const tabBtns = document.querySelectorAll(".config-tab-btn");
    const panels = document.querySelectorAll(".config-panel");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
        });
    });
}

function setupForms() {
    document.getElementById("formPerfil").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btnSalvarPerfil");
        const nome = document.getElementById("inputNome").value.trim();
        const email = document.getElementById("inputEmail").value.trim();
        
        btn.disabled = true;
        try {
            const token = localStorage.getItem("aura_token");
            const res = await fetch(`${API_URL}/perfil`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ nome, email })
            });
            
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("aura_user", JSON.stringify(data.usuario));
                if (data.access_token) localStorage.setItem("aura_token", data.access_token);
                loadProfileData();
                showToast(data.mensagem || "Perfil atualizado com sucesso!");
            } else {
                showToast(data.detail || "Erro ao atualizar perfil.", "error");
            }
        } catch (err) {
            showToast("Erro de comunicação com o servidor.", "error");
        } finally {
            btn.disabled = false;
        }
    });

    document.getElementById("formSenha").addEventListener("submit", async (e) => {
        e.preventDefault();
        const atual = document.getElementById("inputSenhaAtual").value;
        const nova = document.getElementById("inputNovaSenha").value;
        const confirma = document.getElementById("inputConfirmaSenha").value;

        if (nova !== confirma) return showToast("A confirmação da nova senha não bate.", "error");
        if (nova.length < 8) return showToast("A senha deve conter no mínimo 8 caracteres.", "error");

        const btn = document.getElementById("btnSalvarSenha");
        btn.disabled = true;
        try {
            const token = localStorage.getItem("aura_token");
            const res = await fetch(`${API_URL}/senha`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ senha_atual: atual, nova_senha: nova })
            });
            
            if (res.ok) {
                showToast("Senha alterada com sucesso!");
                document.getElementById("formSenha").reset();
            } else {
                const data = await res.json();
                showToast(data.detail || "Erro ao alterar a senha.", "error");
            }
        } catch (err) { showToast("Erro de comunicação.", "error"); } 
        finally { btn.disabled = false; }
    });
}

function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    document.getElementById("toast-msg").textContent = msg;
    toast.className = `toast ${type}`;
    document.getElementById("toast-icon").setAttribute("data-lucide", type === "success" ? "check-circle" : "alert-circle");
    lucide.createIcons();
    
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3500);
}