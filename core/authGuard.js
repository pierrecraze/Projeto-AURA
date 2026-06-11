/**
 * authGuard.js — Blindagem unificada de páginas (Médico e Admin)
 *
 * Como usar: adicione como PRIMEIRO script do <body> passando
 * o atributo data-role na tag script:
 *
 *   Páginas do médico:
 *   <script src="/core/authGuard.js" data-role="medico"></script>
 *
 *   Páginas do admin:
 *   <script src="/core/authGuard.js" data-role="admin"></script>
 *
 * O script roda imediatamente e redireciona antes de qualquer
 * conteúdo ser exibido ao usuário.
 */

(function verificarAcesso() {
  // Descobre qual role esta página exige
  const scriptEl = document.currentScript;
  const roleExigido = scriptEl ? scriptEl.getAttribute("data-role") : null;

  const token = localStorage.getItem("aura_token");

  // 1. Sem token → não está logado
  if (!token) {
    window.location.replace("/login.html");
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    // 2. Token expirado → limpa e manda pro login
    const agora = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < agora) {
      localStorage.removeItem("aura_token");
      localStorage.removeItem("aura_user");
      window.location.replace("/login.html");
      return;
    }

    // 3. Verifica se o role do token bate com o que a página exige
    if (roleExigido && payload.role !== roleExigido) {
      // Manda cada um para a sua área
      if (payload.role === "admin") {
        window.location.replace("/admin/dashboard/index.html");
      } else {
        window.location.replace("/dashboardMedico.html");
      }
      return;
    }
  } catch (e) {
    // Token malformado → limpa e manda pro login
    localStorage.removeItem("aura_token");
    localStorage.removeItem("aura_user");
    window.location.replace("/login.html");
  }
})();
