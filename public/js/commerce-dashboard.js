async function loadDashboard() {
  try {
    const res = await fetch('/api/commerce/stats');

    if (res.status === 401) {
      window.location.href = '/auth/login';
      return;
    }

    const data = await res.json();

    // ── Estadísticas ─────────────────────────────────────────────────────
    document.getElementById('statsContainer').innerHTML = `
      <div class="stat">
        <div class="kpi green">${data.total}</div>
        <div class="lbl">Total de ofertas</div>
      </div>
      <div class="stat">
        <div class="kpi green">${data.activas}</div>
        <div class="lbl">Ofertas activas</div>
      </div>
      <div class="stat">
        <div class="kpi yellow">${data.porVencer}</div>
        <div class="lbl">Por vencer (3 días)</div>
      </div>
      <div class="stat">
        <div class="kpi red">${data.vencidas}</div>
        <div class="lbl">Vencidas</div>
      </div>
      <div class="stat">
        <div class="kpi green">${data.reservasActivas ?? 0}</div>
        <div class="lbl">Reservas activas</div>
      </div>
      <div class="stat">
        <div class="kpi green">${data.unidadesReservadas ?? 0}</div>
        <div class="lbl">Unidades reservadas</div>
      </div>
      <div class="stat">
        <div class="kpi green">$${(data.valorReservado ?? 0).toLocaleString('es-MX')}</div>
        <div class="lbl">Valor reservado (MXN)</div>
      </div>
    `;

    // ── Recientes ────────────────────────────────────────────────────────
    const container = document.getElementById('recientesContainer');

    if (!data.recientes.length) {
      container.innerHTML = `<p class="muted" style="padding:16px 0;">No tienes ofertas publicadas aún.</p>`;
      return;
    }

    container.innerHTML = `<div class="recientes-lista">
      ${data.recientes.map(o => {
        const fecha = o.expirationDate
          ? new Date(o.expirationDate).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })
          : 'Sin fecha';
        const isExpired = o.expirationDate && new Date(o.expirationDate) < new Date();
        const badge = isExpired
          ? '<span class="stamp danger" style="font-size:10px;">Vencida</span>'
          : '<span class="stamp ok"  style="font-size:10px;">Activa</span>';
        const thumb = o.image
          ? `<img src="${o.image}" alt="" />`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:16px;">🍽️</div>`;
        return `
          <div class="reciente-row">
            <div class="reciente-thumb">${thumb}</div>
            <span class="reciente-titulo">${escapeHtml(o.title)}</span>
            <span class="reciente-meta">Caduca: ${fecha}</span>
            ${badge}
            <div class="reciente-acciones">
              <a class="btn btn-outline btn-small" href="/commerce/edit-offer/${o._id}">Editar</a>
              <a class="btn btn-small" href="/ofertas/${o._id}">Ver</a>
            </div>
          </div>`;
      }).join('')}
    </div>`;

  } catch (err) {
    console.error('Error cargando dashboard:', err);
    document.getElementById('statsContainer').innerHTML =
      '<p class="muted">Error al cargar estadísticas.</p>';
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

loadDashboard();
