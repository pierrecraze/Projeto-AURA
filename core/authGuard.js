function verificarAcesso() {
    const token = localStorage.getItem('aura_token');

    if (!token) {
        // O uso da barra '/' no início garante que o caminho seja absoluto,
        // não importa em qual pasta o usuário esteja tentando entrar.
        window.location.replace('/login.html');
        return;
    }

    // Médicos (identificados pelo CRM) não têm acesso ao hub administrativo:
    // são redirecionados para o painel próprio deles.
    const dados = JSON.parse(localStorage.getItem('aura_user') || 'null');
    if (dados && dados.crm) {
        window.location.replace('/dashboardMedico.html');
        return;
    }
}

verificarAcesso();