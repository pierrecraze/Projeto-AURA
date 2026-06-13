const API_URL = "/api";

let triagensExportData = [];

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

        // Mapear dados processados para exportação PDF/CSV
        triagensExportData = triagens.map(t => {
            const med = medicos.find(m => m.id === t.medico_id) || { nome: "Desconhecido" };
            const pac = pacientes.find(p => p.id === t.paciente_id) || { nome: "Desconhecido" };
            return {
                data: new Date(t.data_hora).toLocaleString('pt-BR'),
                medico: med.nome,
                paciente: pac.nome
            };
        });

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
    setupExportModal();
});

// ==========================================
// EXPORTAÇÃO E MODAL DE PREVIEW
// ==========================================
function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    const msgEl = document.getElementById("toast-msg");
    const icon = document.getElementById("toast-icon");
    if (msgEl) msgEl.textContent = msg;
    
    if (icon) {
        if (type === "success") {
            icon.setAttribute("data-lucide", "check-circle");
            toast.style.background = "#F0FDF4"; toast.style.color = "#15803D"; toast.style.borderColor = "#BBF7D0";
        } else {
            icon.setAttribute("data-lucide", "alert-circle");
            toast.style.background = "#FEF2F2"; toast.style.color = "#DC2626"; toast.style.borderColor = "#FECACA";
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3500);
}

function getDataHoraAtual() {
    const now = new Date();
    return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
}

function exportarCSV() {
    const header = ["Data / Hora", "Médico Responsável", "Paciente Avaliado"];
    const rows = triagensExportData.map(t => [t.data, t.medico, t.paciente]);
    const metadata = `"Relatório de Triagens - Instituto Buko Kaesemodel"\n"Baixado em: ${getDataHoraAtual()}"\n\n`;
    const csv = metadata + [header, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `triagens_aura_${new Date().getTime()}.csv`; a.click();
    URL.revokeObjectURL(url);
}

function exportarPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) return showToast("Erro: Biblioteca PDF não carregada.", "error");
    const { jsPDF } = window.jspdf; const doc = new jsPDF('portrait');
    doc.setFontSize(14); doc.text("Relatório de Triagens - Instituto Buko Kaesemodel", 14, 15);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Baixado em: ${getDataHoraAtual()}`, 14, 22);
    const rows = triagensExportData.map(t => [t.data, t.medico, t.paciente]);
    doc.autoTable({ head: [["Data / Hora", "Médico Responsável", "Paciente Avaliado"]], body: rows, startY: 28, styles: { fontSize: 9 }, headStyles: { fillColor: [13, 27, 53] } });
    doc.save(`triagens_aura_${new Date().getTime()}.pdf`);
}

function setupExportModal() {
    const btnModal = document.getElementById("btnExportModal");
    const overlay = document.getElementById("modalExportOverlay");
    if (!btnModal || !overlay) return;
    let selectedFormat = 'pdf';
    function fecharExport() { overlay.style.display = "none"; document.body.style.overflow = ""; }
    function gerarLivePreview() {
        const amostra = triagensExportData.slice(0, 5);
        const previewArea = document.getElementById("exportLivePreview");
        if (selectedFormat === 'pdf') {
            previewArea.className = "export-live-preview";
            let html = `<div class="preview-doc-title">Relatório de Triagens</div><div style="text-align:center; font-size:10px; color:#64748B; margin-bottom: 14px; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px;">Baixado em: ${getDataHoraAtual()}</div>`;
            html += `<table class="preview-doc-table"><thead><tr><th>Data / Hora</th><th>Médico</th><th>Paciente</th></tr></thead><tbody>`;
            if (amostra.length === 0) html += `<tr><td colspan="3" style="text-align:center; color:#94A3B8;">Nenhum dado encontrado</td></tr>`;
            else { amostra.forEach(t => { html += `<tr><td>${t.data}</td><td>${t.medico}</td><td>${t.paciente}</td></tr>`; });
            if (triagensExportData.length > 5) html += `<tr><td colspan="3" style="text-align:center; color:#94A3B8;">... e mais ${triagensExportData.length - 5} triagens</td></tr>`; }
            previewArea.innerHTML = html + `</tbody></table>`;
        } else {
            previewArea.className = "export-live-preview csv-mode";
            let txt = `"Relatório de Triagens - Instituto Buko Kaesemodel"\n"Baixado em: ${getDataHoraAtual()}"\n\nData/Hora,Médico,Paciente\n`;
            amostra.forEach(t => { txt += `"${t.data}","${t.medico}","${t.paciente}"\n`; });
            if (triagensExportData.length > 5) txt += `\n... e mais ${triagensExportData.length - 5} linhas omitidas`;
            previewArea.textContent = txt;
        }
    }
    btnModal.addEventListener("click", () => { overlay.style.display = "flex"; document.body.style.overflow = "hidden"; gerarLivePreview(); });
    [document.getElementById("modalExportClose"), document.getElementById("btnExportCancel")].forEach(b => b.addEventListener("click", fecharExport));
    overlay.addEventListener("click", e => { if (e.target === overlay) fecharExport(); });
    ['pdf', 'csv'].forEach(fmt => {
        document.getElementById(`format${fmt.charAt(0).toUpperCase() + fmt.slice(1)}`).addEventListener("click", () => {
            selectedFormat = fmt;
            document.getElementById("formatPdf").classList.toggle("active", fmt === 'pdf');
            document.getElementById("formatCsv").classList.toggle("active", fmt === 'csv');
            gerarLivePreview();
        });
    });
    document.getElementById("btnExportConfirm").addEventListener("click", () => {
        fecharExport(); if (selectedFormat === 'csv') { showToast("Baixando CSV..."); exportarCSV(); } else { showToast("Gerando PDF..."); exportarPDF(); }
    });
}