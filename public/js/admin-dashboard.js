function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str ?? ""));
  return d.innerHTML;
}

const EVENT_LABELS = {
  'auth.login.success': { label: 'Login OK', stamp: 'ok' },
  'auth.login.failed': { label: 'Login fallido', stamp: 'danger' },
  'auth.register': { label: 'Registro', stamp: 'info' },
  'auth.logout': { label: 'Logout', stamp: 'info' },
  'offer.create': { label: 'Oferta creada', stamp: 'ok' },
  'offer.update': { label: 'Oferta editada', stamp: 'warn' },
  'offer.delete': { label: 'Oferta eliminada', stamp: 'danger' },
  'reservation.create': { label: 'Reserva creada', stamp: 'ok' },
};

async function loadAuditLog() {
  const container = document.getElementById('auditContainer');

  try {
    const res = await fetch('/api/admin/audit-log');

    if (res.status === 401) {
      window.location.href = '/auth/login';
      return;
    }
    if (res.status === 403) {
      container.innerHTML = '<div class="empty-state"><p>No tienes permiso para ver esta página.</p></div>';
      return;
    }

    const logs = await res.json();

    if (!logs.length) {
      container.innerHTML = '<div class="empty-state"><p>Todavía no hay eventos registrados.</p></div>';
      return;
    }

    container.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-family:var(--font-mono); font-size:12.5px;">
        <thead>
          <tr style="text-align:left; border-bottom:1px solid var(--line);">
            <th style="padding:12px 16px;">Evento</th>
            <th style="padding:12px 16px;">Usuario</th>
            <th style="padding:12px 16px;">IP</th>
            <th style="padding:12px 16px;">Fecha</th>
            <th style="padding:12px 16px;">Detalle</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(l => {
            const meta = EVENT_LABELS[l.event] || { label: l.event, stamp: 'info' };
            const fecha = new Date(l.createdAt).toLocaleString('es-MX');
            const detail = l.detail ? escapeHtml(JSON.stringify(l.detail)) : '—';
            return `
              <tr style="border-bottom:1px solid var(--line);">
                <td style="padding:10px 16px;"><span class="stamp ${meta.stamp}">${meta.label}</span></td>
                <td style="padding:10px 16px;">${escapeHtml(l.email) || '—'}</td>
                <td style="padding:10px 16px;">${escapeHtml(l.ip) || '—'}</td>
                <td style="padding:10px 16px; white-space:nowrap;">${fecha}</td>
                <td style="padding:10px 16px; color:var(--muted); max-width:260px; overflow:hidden; text-overflow:ellipsis;">${detail}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="empty-state"><p>Error al cargar el registro.</p></div>';
  }
}

loadAuditLog();
