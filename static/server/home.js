/* ============================================================
   home.js — lógica do painel AURA
   Responsabilidades:
     - Gerenciamento de sessão (inatividade + aviso de expiração)
     - Logout
     - Bloqueio de acesso sem autenticação
   ============================================================ */

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 min de inatividade (RNF14)
const SESSION_WARNING_MS = 2 * 60 * 1000; // aviso com 2 min restantes (RF20)

let inactivityTimer;
let warningTimer;
let countdownInterval;
let warningActive = false;

const banner = document.getElementById("sessionBanner");
const countdown = document.getElementById("sessionCountdown");
const btnKeep = document.getElementById("btnKeepSession");
const btnLogout = document.getElementById("btnLogout");

/* ---- Utilitários ---- */
function pad(n) {
  return String(n).padStart(2, "0");
}

function formatCountdown(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${pad(s)}`;
}

/* ---- Logout ---- */
function logout() {
  clearTimers();
  /*
    Aqui você fará a chamada à sua API FastAPI:

    await fetch('/api/auth/logout', { method: 'POST' });

    Depois redireciona:
  */
  window.location.href = "/login.html";
}

/* ---- Exibir aviso de sessão (RF20) ---- */
function showSessionWarning() {
  if (warningActive) return;
  warningActive = true;

  banner.classList.add("visible");

  let remainingMs = SESSION_WARNING_MS;
  countdown.textContent = formatCountdown(remainingMs);

  countdownInterval = setInterval(() => {
    remainingMs -= 1000;
    countdown.textContent = formatCountdown(remainingMs);

    if (remainingMs <= 0) {
      clearInterval(countdownInterval);
      logout();
    }
  }, 1000);
}

/* ---- Ocultar aviso e renovar sessão ---- */
function dismissWarning() {
  clearInterval(countdownInterval);
  banner.classList.remove("visible");
  warningActive = false;

  /*
    Chamada para renovar o token/sessão no backend:
    await fetch('/api/auth/refresh', { method: 'POST' });
  */

  resetInactivityTimer();
}

/* ---- Limpar todos os timers ---- */
function clearTimers() {
  clearTimeout(inactivityTimer);
  clearTimeout(warningTimer);
  clearInterval(countdownInterval);
}

/* ---- Reiniciar timer de inatividade ---- */
function resetInactivityTimer() {
  clearTimers();
  warningActive = false;

  /* Dispara o aviso quando restam SESSION_WARNING_MS para expirar */
  warningTimer = setTimeout(
    showSessionWarning,
    SESSION_TIMEOUT_MS - SESSION_WARNING_MS,
  );

  /* Logout automático ao fim do tempo total */
  inactivityTimer = setTimeout(logout, SESSION_TIMEOUT_MS);
}

/* ---- Eventos de atividade do usuário ---- */
const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "mousedown",
  "touchstart",
  "scroll",
];

ACTIVITY_EVENTS.forEach((event) => {
  document.addEventListener(
    event,
    () => {
      if (!warningActive) resetInactivityTimer();
    },
    { passive: true },
  );
});

/* ---- Botões ---- */
btnKeep.addEventListener("click", dismissWarning);
btnLogout.addEventListener("click", logout);

/* ---- Inicialização ---- */
(function init() {
  /*
    Verificação de autenticação:
    Se o backend retornar 401 em qualquer rota protegida,
    redirecione para /login. Exemplo com interceptor global:

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401) logout();
      return res;
    };
  */

  resetInactivityTimer();
})();
