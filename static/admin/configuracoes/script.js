const API_URL = "http://localhost:8000/api/auth";

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    document.getElementById("current-date").textContent = today;

    setupSidebar();
    setupTabs();
    loadProfileData();
    setupForms();
    setupAvatarUpload();
    lucide.createIcons();
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
            window.location.replace('/static/login.html');
        });
    }
}

function loadProfileData() {
    const user = JSON.parse(localStorage.getItem("aura_user") || "{}");
    const nome = user.nome || "Admin Principal";
    const email = user.email || "";
    const iniciais = nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "AD";
    const avatarUrl = user.avatar || null;

    document.getElementById("profileName").textContent = nome;
    
    if (avatarUrl) {
        document.getElementById("profileAvatar").innerHTML = `<img src="${avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        document.getElementById("avatarPreview").innerHTML = `<img src="${avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
        document.getElementById("profileAvatar").textContent = iniciais;
        document.getElementById("avatarPreview").textContent = iniciais;
    }

    document.getElementById("inputNome").value = nome;
    document.getElementById("inputEmail").value = email;
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

function setupAvatarUpload() {
    const input = document.getElementById("inputAvatar");
    if (input) {
        input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    return showToast("A imagem deve ter no máximo 2MB.", "error");
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    const user = JSON.parse(localStorage.getItem("aura_user") || "{}");
                    user.avatar = event.target.result;
                    localStorage.setItem("aura_user", JSON.stringify(user));
                    loadProfileData();
                    showToast("Foto de perfil atualizada!");
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

window.removerFoto = function() {
    const user = JSON.parse(localStorage.getItem("aura_user") || "{}");
    delete user.avatar;
    localStorage.setItem("aura_user", JSON.stringify(user));
    loadProfileData();
    showToast("Foto removida!");
};