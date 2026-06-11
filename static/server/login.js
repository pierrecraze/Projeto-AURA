// 1. Mapeamento dos elementos do HTML
const togglePw   = document.getElementById('togglePw');
const senhaInput = document.getElementById('senha');
const eyeIcon    = document.getElementById('eyeIcon');
const form       = document.getElementById('loginForm'); // Aqui está a variável que o erro não achou!
const btn        = document.getElementById('btnLogin');
const emailEl    = document.getElementById('email');

// 2. Ícones SVG para o botão de mostrar/ocultar senha
const eyeOpen   = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
const eyeClosed = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';

// 3. Lógica visual da tela
togglePw.addEventListener('click', () => {
  const visible = senhaInput.type === 'text';
  senhaInput.type = visible ? 'password' : 'text';
  eyeIcon.innerHTML = visible ? eyeOpen : eyeClosed;
  togglePw.setAttribute('aria-label', visible ? 'Mostrar senha' : 'Ocultar senha');
  togglePw.setAttribute('aria-pressed', String(!visible));
});

function setInvalid(id, show) {
  document.getElementById(id).classList.toggle('invalid', show);
}

function showAlert(msg, type) {
  const el = document.getElementById('alertBanner');
  el.className = 'alert ' + type;
  document.getElementById('alertMsg').textContent = msg;
}

function hideAlert() {
  document.getElementById('alertBanner').className = 'alert';
}

// Limpa os alertas vermelhos quando o usuário começa a digitar de novo
emailEl.addEventListener('input',    () => setInvalid('grpEmail', false));
senhaInput.addEventListener('input', () => setInvalid('grpSenha', false));

// 4. A Lógica Real de Autenticação (A comunicação com o Python — Padrão OAuth2)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const email = emailEl.value.trim();
  const senha = senhaInput.value;
  let valid = true;

  // Validações básicas do Front-end
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setInvalid('grpEmail', true); valid = false;
  } else { setInvalid('grpEmail', false); }

  if (!senha) {
    setInvalid('grpSenha', true); valid = false;
  } else { setInvalid('grpSenha', false); }

  if (!valid) return;

  // Mostra o loading no botão
  btn.disabled = true;
  btn.classList.add('loading');

  try {
      // CORREÇÃO: Cria os dados no formato application/x-www-form-urlencoded
      const corpoFormulario = new URLSearchParams();
      corpoFormulario.append('username', email); // O FastAPI agora espera 'username'
      corpoFormulario.append('password', senha); // O FastAPI agora espera 'password'

      // Bate na porta do FastAPI
      const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded' // CORREÇÃO: Header alterado para aceitar form data
          },
          body: corpoFormulario // CORREÇÃO: Passando o objeto de formulário em vez de string JSON
      });

      // Se o Python devolver 200 OK
      if (response.ok) {
          const data = await response.json();
          
          // Guarda a Pulseira VIP (Token) no cofre do navegador
          localStorage.setItem('aura_token', data.access_token);
          localStorage.setItem('aura_user', JSON.stringify(data.usuario));
          
          showAlert('Login realizado com sucesso! Redirecionando...', 'success');
          
          // Redireciona para o Dashboard
          setTimeout(() => {
              window.location.href = '/admin/dashboard/index.html'; 
          }, 1000);

      } else {
          // Se o Python devolver 401 (Erro de credencial) ou 422 (Erro de formato)
          const errorData = await response.json();
          showAlert(errorData.detail || 'Credenciais inválidas. Verifique e tente novamente.', 'error');
          senhaInput.value = ''; // Limpa a senha
      }

  } catch (error) {
      // Se o Python estiver desligado ou bloquear a requisição (CORS)
      console.error('Erro no login:', error);
      showAlert('Erro de conexão. Verifique se o servidor backend está rodando.', 'error');
  } finally {
      // Tira o loading do botão
      btn.disabled = false;
      btn.classList.remove('loading');
  }
});