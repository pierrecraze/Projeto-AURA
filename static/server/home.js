/* ============================================================
   home.js — lógica do painel AURA
   Responsabilidades:
     - Gerenciamento de sessão (inatividade + aviso de expiração)
     - Logout
     - Bloqueio de acesso sem autenticação
   ============================================================ */

/* ============================================================
   Utilitários compartilhados — disponíveis em todas as páginas que
   carregam o home.js (que carrega antes dos demais scripts).
   Evita reescrever "iniciais" e formatação de data em cada arquivo.
   ============================================================ */

/** Iniciais a partir do nome (1 ou 2 letras). `fallback` quando vazio. */
function iniciais(nome, fallback = "??") {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return fallback;
  const ini = partes.length >= 2 ? partes[0][0] + partes[1][0] : partes[0][0];
  return ini.toUpperCase();
}

/** Formata data BR (DD/MM/AAAA). Aceita "AAAA-MM-DD" ou ISO com hora. */
function dataBR(valor) {
  if (!valor) return "-";
  const s = String(valor);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  // Data pura: formata direto, evitando o desvio de fuso do new Date().
  if (m && s.length <= 10) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
}

const SESSION_TIMEOUT_MS  = 10 * 60 * 1000;   // 10 min de inatividade (RNF14)
const SESSION_WARNING_MS  =  2 * 60 * 1000;   // aviso com 2 min restantes (RF20)

let inactivityTimer;
let warningTimer;
let countdownInterval;
let warningActive = false;

const banner       = document.getElementById('sessionBanner');
const countdown    = document.getElementById('sessionCountdown');
const btnKeep      = document.getElementById('btnKeepSession');
const btnLogout    = document.getElementById('btnLogout');

/* ---- Utilitários ---- */
function pad(n) {
  return String(n).padStart(2, '0');
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
  localStorage.removeItem('aura_token');
  localStorage.removeItem('aura_user');
  window.location.href = '/login.html';
}

/* ---- Exibir aviso de sessão (RF20) ---- */
function showSessionWarning() {
  if (warningActive) return;
  warningActive = true;

  banner.classList.add('visible');

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
  banner.classList.remove('visible');
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
  warningTimer = setTimeout(showSessionWarning, SESSION_TIMEOUT_MS - SESSION_WARNING_MS);

  /* Logout automático ao fim do tempo total */
  inactivityTimer = setTimeout(logout, SESSION_TIMEOUT_MS);
}

/* ---- Eventos de atividade do usuário ---- */
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

ACTIVITY_EVENTS.forEach(event => {
  document.addEventListener(event, () => {
    if (!warningActive) resetInactivityTimer();
  }, { passive: true });
});

/* ---- Botões ---- */
btnKeep.addEventListener('click', dismissWarning);
btnLogout.addEventListener('click', logout);

/* ---- Informações do usuário logado no cabeçalho ---- */
function preencherHeaderUsuario() {
  const dados = JSON.parse(localStorage.getItem('aura_user') || 'null');
  if (!dados) return;

  const nomeEl  = document.querySelector('.user-name');
  const cargoEl = document.querySelector('.user-role');
  const avatarEl = document.querySelector('.user-avatar');

  if (nomeEl && dados.nome) nomeEl.textContent = dados.nome;
  if (cargoEl && dados.cargo) cargoEl.textContent = dados.cargo;
  if (avatarEl && dados.nome) {
    const iniciais = dados.nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
    avatarEl.textContent = iniciais || 'DR';
  }
}

/* ---- Interceptor global: redireciona ao login em respostas 401 ---- */
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const res = await originalFetch(...args);
  if (res.status === 401) logout();
  return res;
};

/* ---- Inicialização ---- */
(function init() {
  if (!localStorage.getItem('aura_token')) {
    window.location.replace('/login.html');
    return;
  }

  // Administradores (sem CRM) não têm acesso ao painel do médico:
  // são redirecionados para o hub administrativo.
  const dados = JSON.parse(localStorage.getItem('aura_user') || 'null');
  if (!dados || !dados.crm) {
    window.location.replace('/admin/dashboard/index.html');
    return;
  }

  preencherHeaderUsuario();
  resetInactivityTimer();
})();
