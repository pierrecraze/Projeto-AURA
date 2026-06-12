const API_URL = "/api";
	async function init() {
    lucide.createIcons();
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
        
        document.getElementById('kpi-total').textContent = triagens.length;
        
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = "";
        
        if (triagens.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center;">Nenhuma triagem encontrada.</td></tr>`;
            return;
        }
        
        triagens.forEach(t => {
            const med = medicos.find(m => m.id === t.medico_id) || { nome: "Desconhecido" };
            const pac = pacientes.find(p => p.id === t.paciente_id) || { nome: "Desconhecido" };
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${new Date(t.data_hora).toLocaleString('pt-BR')}</td>
                <td>${med.nome}</td>
                <td>${pac.nome_completo}</td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch(err) {
        console.error(err);
        document.getElementById('table-body').innerHTML = `<tr><td colspan="3" style="text-align: center; color: red;">Erro ao carregar dados.</td></tr>`;
    }
}

// Configurar o botão da sidebar colapsável para evitar erro caso clique
const toggleBtn = document.getElementById('sidebarToggle');
if(toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });
}

document.addEventListener("DOMContentLoaded", init);