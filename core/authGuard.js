function verificarAcesso() {
    const token = localStorage.getItem('aura_token');

    if (!token) {
        // O uso da barra '/' no início garante que o caminho seja absoluto,
        // não importa em qual pasta o usuário esteja tentando entrar.
        window.location.replace('/static/login.html'); 
        return; 
    }
}

verificarAcesso();