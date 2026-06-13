const API_URL = "/api";

async function init() {
    const token = localStorage.getItem('aura_token');
    const opts = { headers: { 'Authorization': `Bearer ${token}` } };
    
    try {
        const [resTriagens, resMed, resPac] = await Promise.all([
            fetch(`${API_URL}/triagens/`, opts),
            fetch(`${API_URL}/medicos/`, opts),
            fetch(`${API_URL}/pacientes/`, opts)
        ]);
        
        const triagens = resTriagens.ok ? await resTriagens.json() : [];
        const medicos = resMed.ok ? await resMed.json() : [];
        const pacientes = resPac.ok ? await resPac.json() : [];
        
        const kpiTotal = document.getElementById('kpi-total');
        if(kpiTotal) kpiTotal.textContent = triagens.length;
        
        const tbody = document.getElementById('table-body');
        if(!tbody) return;
        tbody.innerHTML = "";
        
        if (triagens.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center;">Nenhuma triagem encontrada.</td></tr>`;
            return;
        }
        
        // Ordenar por data decrescente
        triagens.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));

        triagens.forEach(t => {
            const med = medicos.find(m => m.id === t.medico_id) || { nome: "Desconhecido" };
            const pac = pacientes.find(p => p.id === t.paciente_id) || { nome: "Desconhecido" };
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${new Date(t.data_hora).toLocaleString('pt-BR')}</td>
                <td>${med.nome}</td>
                <td>${pac.nome}</td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch(err) {
        console.error(err);
        const tbody = document.getElementById('table-body');
        if(tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: red;">Erro ao carregar dados.</td></tr>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Data atual na topbar
    const today = new Date().toLocaleDateString("pt-BR", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
    const dateEl = document.getElementById("current-date");
    if(dateEl) dateEl.textContent = today;

    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const toggleIcon = document.getElementById("toggleIcon");
    let collapsed = false;
    if(toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            collapsed = !collapsed;
            sidebar.classList.toggle('collapsed', collapsed);
            if(toggleIcon) toggleIcon.setAttribute("data-lucide", collapsed ? "panel-left-open" : "menu");
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    // Profile Popup
    const profileCard = document.getElementById("profileCard");
    const profilePopup = document.getElementById("profilePopup");
    if (profileCard && profilePopup) {
        profileCard.addEventListener("click", (e) => {
            e.stopPropagation();
            profilePopup.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
            if (!profilePopup.contains(e.target)) {
                profilePopup.classList.remove("show");
            }
        });
    }

    // Logout
    const btnLogout = document.getElementById('popupLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            window.location.replace('/login.html');
        });
    }

    // Preencher dados do admin
    const user = JSON.parse(localStorage.getItem("aura_user") || "{}");
    const nome = user.nome || "Admin Principal";
    const iniciais = nome.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase() || "AD";
    
    const profileNameEl = document.getElementById("profileName");
    if (profileNameEl) profileNameEl.textContent = nome;
    
    const popupNameEl = document.getElementById("popupName");
    if (popupNameEl) popupNameEl.textContent = nome;
    
    const profileAvatarEl = document.getElementById("profileAvatar");
    if (profileAvatarEl) profileAvatarEl.textContent = iniciais;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    init();
});