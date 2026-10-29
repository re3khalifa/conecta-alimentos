(function () {
  const box = document.getElementById('reportContainer');
  if (!box) return;
  const nf = new Intl.NumberFormat('es-MX');
  const esc = (s) => { const d = document.createElement('div'); d.appendChild(document.createTextNode(s ?? '')); return d.innerHTML; };
  const ROLES = { user: 'Usuarios', commerce: 'Comercios', admin: 'Administradores' };
  const EVENTS = {
    'auth.login.success': 'Login OK', 'auth.login.failed': 'Login fallido', 'auth.register': 'Registros',
    'auth.logout': 'Logout', 'offer.create': 'Ofertas creadas', 'offer.update': 'Ofertas editadas',
    'offer.delete': 'Ofertas eliminadas', 'reservation.create': 'Reservas creadas', 'reservation.cancel': 'Reservas canceladas',
  };

  async function load() {
    try {
      const res = await fetch('/api/admin/reportes');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();

      const act = d.reservasPorEstado.find((r) => r.estado === 'activa') || { reservas: 0, unidades: 0 };
      const can = d.reservasPorEstado.find((r) => r.estado === 'cancelada') || { reservas: 0 };
      const metrics = [
        ...d.usuariosPorRol.map((u) => [u.total, ROLES[u.rol] || u.rol]),
        [d.totalOfertas, 'Ofertas publicadas'],
        [act.reservas, 'Reservas activas'],
        [can.reservas, 'Reservas canceladas'],
      ];
      const maxEv = Math.max(1, ...d.eventosUltimos7dias.map((e) => e.total));
      const events = d.eventosUltimos7dias.length
        ? d.eventosUltimos7dias.map((e) => `
            <div class="hbar"><span>${esc(EVENTS[e.evento] || e.evento)}</span>
            <div class="track"><div class="fill" style="width:${(e.total / maxEv) * 100}%"></div></div><strong>${e.total}</strong></div>`).join('')
        : '<p class="muted">Sin eventos en los últimos 7 días.</p>';
      const top = d.topOfertas.length
        ? `<ol style="margin:0; padding-left:20px;">${d.topOfertas.map((o) => `<li>${esc(o.titulo)} — <strong>${o.unidades}</strong> unidades (${o.reservas} reservas)</li>`).join('')}</ol>`
        : '<p class="muted">Todavía no hay reservas.</p>';

      box.innerHTML = `
        <div class="metric-grid">${metrics.map(([n, l]) => `<div class="metric"><div class="num">${nf.format(n)}</div><div class="lbl">${esc(l)}</div></div>`).join('')}</div>
        <h3 class="chart-title">Actividad de los últimos 7 días</h3>${events}
        <h3 class="chart-title">Ofertas más reservadas</h3>${top}
        <p style="margin-top:18px;"><a class="btn btn-small" href="/api/admin/reportes/reservas.csv">Descargar reservas (CSV)</a></p>`;
    } catch (e) {
      console.error(e);
      box.innerHTML = '<p class="muted">No se pudo cargar el reporte.</p>';
    }
  }
  load();
})();
