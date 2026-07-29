document.addEventListener('DOMContentLoaded', () => {
  const form     = document.getElementById('registerForm');
  const msg      = document.getElementById('formMsg');
  const emailEl  = document.getElementById('email');
  const passEl   = document.getElementById('password');
  const roleEl   = document.getElementById('role');
  const privacyEl = document.getElementById('privacyAccepted');
  privacyEl.addEventListener('change', () => {
  if (privacyEl.checked) {
    setMsg('');
  }
  });
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  // ── Feedback de mensaje ──────────────────────────────────────────────────
  const setMsg = (text, ok = false) => {
    msg.textContent = text || '';
    msg.style.color = ok ? 'var(--milpa)' : 'var(--brasa)';
  };

  // ── Validación en tiempo real ────────────────────────────────────────────
  emailEl.addEventListener('input', () => {
    const val = emailEl.value.trim();
    if (!val) return;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    emailEl.style.borderColor = valid ? 'rgba(34,197,94,.6)' : 'rgba(239,68,68,.6)';
  });

  passEl.addEventListener('input', () => {
    const val = passEl.value;
    if (!val) return;
    passEl.style.borderColor = val.length >= 8 ? 'rgba(34,197,94,.6)' : 'rgba(239,68,68,.6)';
  });

  // ── Submit ───────────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');

    const email    = emailEl.value.trim();
    const password = passEl.value;
    const role     = roleEl ? roleEl.value : 'user';

    // Validaciones frontend
    if (!email || !password) {
      setMsg('Completa email y contraseña.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg('El email no es válido.');
      return;
    }
    if (password.length < 8) {
      setMsg('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    try {
      if (!privacyEl.checked) {
      setMsg('Debes aceptar el aviso de privacidad.');
      return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Registrando...';

      const res = await fetchCsrf('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, privacyAccepted: privacyEl.checked }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.errors?.length) {
          setMsg(data.errors.map(x => x.msg).join(' · '));
        } else {
          setMsg(data.message || 'Error al registrar');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrarme';
        return;
      }

      setMsg('Registro exitoso. Redirigiendo...', true);
      setTimeout(() => (window.location.href = '/auth/login'), 1500);

    } catch {
      setMsg('No se pudo conectar con el servidor.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrarme';
    }

  });
});
