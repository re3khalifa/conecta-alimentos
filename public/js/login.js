document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const msg = document.getElementById('formMsg');
        const btn = document.getElementById('submitBtn');
        msg.textContent = '';
        btn.disabled = true;
        btn.textContent = 'Entrando...';

        const body = {
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('password').value,
        };

        try {
          const res = await fetchCsrf('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          const data = await res.json();

          if (res.ok) {
            // Cookie ya seteada por el servidor (HttpOnly)
            // Redirigir según rol
            const redirects = {
              commerce: '/commerce',
              admin: '/admin',
              user: '/',
            };
            window.location.href = redirects[data.user.role] || '/';
          } else {
            // Mostrar errores de validación o credenciales
            if (data.errors) {
              msg.textContent = data.errors.map(e => e.msg).join(' · ');
            } else {
              msg.textContent = data.message || 'Error al iniciar sesión';
            }
            btn.disabled = false;
            btn.textContent = 'Entrar';
          }
        } catch (err) {
          msg.textContent = 'Error de conexión. Intenta de nuevo.';
          btn.disabled = false;
          btn.textContent = 'Entrar';
        }
      });