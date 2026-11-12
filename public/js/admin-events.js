// Eventos de los últimos 7 días para la página de Auditoría.
// Aquí SÍ se muestran todos los eventos (incluidos logout y registros).
(function () {
  const box = document.getElementById('eventsSummary');
  if (!box) return;
  const esc = (s) => { const d = document.createElement('div'); d.appendChild(document.createTextNode(s ?? '')); return d.innerHTML; };
  const EVENTS = {
    'auth.login.success': 'Login OK',
    'auth.login.failed': 'Login fallido',
    'auth.register': 'Registros',
    'auth.logout': 'Logout',
    'offer.create': 'Ofertas creadas',
    'offer.update': 'Ofertas editadas',
    'offer.delete': 'Ofertas eliminadas',
    'reservation.create': 'Reservas creadas',
    'reservation.cancel': 'Reservas canceladas',
  };

  async function load() {
    try {
      const res = await fetch('/api/admin/reportes');
      if (res.status === 401) { window.location.href = '/auth/login'; return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();

      const list = d.eventosUltimos7dias;
      if (!list.length) {
        box.innerHTML = '<p class="muted">Sin eventos en los últimos 7 días.</p>';
        return;
      }
      const max = Math.max(1, ...list.map((e) => e.total));
      box.innerHTML = list.map((e) => `
        <div class="hbar">
          <span>${esc(EVENTS[e.evento] || e.evento)}</span>
          <div class="track"><div class="fill" style="width:${(e.total / max) * 100}%"></div></div>
          <strong>${e.total}</strong>
        </div>`).join('');
    } catch (err) {
      console.error(err);
      box.innerHTML = '<p class="muted">No se pudieron cargar los eventos.</p>';
    }
  }
  load();
})();
