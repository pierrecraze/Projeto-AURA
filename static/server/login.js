    const togglePw   = document.getElementById('togglePw');
    const senhaInput = document.getElementById('senha');
    const eyeIcon    = document.getElementById('eyeIcon');

    const eyeOpen   = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    const eyeClosed = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';

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

    const form    = document.getElementById('loginForm');
    const btn     = document.getElementById('btnLogin');
    const emailEl = document.getElementById('email');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const email = emailEl.value.trim();
      const senha = senhaInput.value;
      let valid = true;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setInvalid('grpEmail', true); valid = false;
      } else { setInvalid('grpEmail', false); }

      if (!senha) {
        setInvalid('grpSenha', true); valid = false;
      } else { setInvalid('grpSenha', false); }

      if (!valid) return;

      btn.disabled = true;
      btn.classList.add('loading');
      await new Promise(r => setTimeout(r, 1800));
      btn.disabled = false;
      btn.classList.remove('loading');

      // substituir pela lógica real de autenticação
      showAlert('Credenciais inválidas. Verifique e tente novamente.', 'error');
    });

    emailEl.addEventListener('input',    () => setInvalid('grpEmail', false));
    senhaInput.addEventListener('input', () => setInvalid('grpSenha', false));
  