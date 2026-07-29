// ── Utilidad: toast de feedback (reemplaza alert()) ──────────────────────
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ── Cargar ofertas del usuario autenticado ───────────────────────────────
async function loadOffers() {
  const container = document.getElementById('offersContainer');

  try {
    const res = await fetch('/api/ofertas/mine');

    if (res.status === 401) {
      window.location.href = '/auth/login';
      return;
    }

    if (!res.ok) {
      container.innerHTML = '<div class="empty-state"><p>Error al cargar las ofertas.</p></div>';
      return;
    }

    const offers = await res.json();
    container.innerHTML = '';

    if (!offers.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No tienes ofertas registradas aún.</p>
          <a class="btn" href="/commerce/new-offer">Crear primera oferta</a>
        </div>`;
      return;
    }

    offers.forEach(offer => renderCard(offer, container));

  } catch (err) {
    console.error('Error cargando ofertas:', err);
    container.innerHTML = '<div class="empty-state"><p>Error de conexión. Intenta recargar la página.</p></div>';
  }
}

// ── Renderizar una card de oferta ────────────────────────────────────────
function renderCard(offer, container) {
  const isExpired = offer.expirationDate
    ? new Date(offer.expirationDate) < new Date()
    : false;

  const stampHTML = isExpired
    ? '<span class="stamp danger ticket-stamp">Vencida</span>'
    : '<span class="stamp ok ticket-stamp">Activa</span>';

  const fechaExpiracion = offer.expirationDate
    ? new Date(offer.expirationDate).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric'
      })
    : 'Sin fecha';

  const precioHTML = offer.price != null
    ? `$${Number(offer.price).toFixed(2)}`
    : 'N/D';

  const mediaHTML = offer.image
    ? `<img src="${offer.image}" alt="${escapeHtml(offer.title)}" loading="lazy" />`
    : `<div class="no-photo">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l1-5h16l1 5M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M8 13a2 2 0 104 0 2 2 0 00-4 0z"/></svg>
         <span>Sin foto</span>
       </div>`;

  const article = document.createElement('article');
  article.className = 'ticket';
  article.dataset.id = offer._id;

  article.innerHTML = `
    <div class="ticket-media">
      ${mediaHTML}
      ${stampHTML}
    </div>
    <div class="ticket-perf"></div>
    <div class="ticket-body">
      <span class="ticket-cat">${escapeHtml(offer.category) || 'Sin categoría'}</span>
      <h3 class="ticket-title">${escapeHtml(offer.title)}</h3>
      <p class="ticket-desc">${escapeHtml(offer.description || '')}</p>
      <div class="ticket-price-row">
        <span class="ticket-price">${precioHTML}<small>MXN</small></span>
        <span class="ticket-exp">Caduca: ${fechaExpiracion}</span>
      </div>
      <p class="muted" style="font-family:var(--font-mono); font-size:11.5px; margin-top:6px;">
        Total: <b>${offer.quantity}</b> ·
        Reservadas: <b>${offer.reservedCount}</b> ·
        Disponibles: <b>${offer.available}</b>
      </p>
      <div class="ticket-actions">
        <a class="btn btn-small btn-outline" href="/ofertas/${offer._id}">Ver</a>
        <a class="btn btn-small btn-outline" href="/commerce/edit-offer/${offer._id}">Editar</a>
        <button class="btn btn-small btn-danger" data-delete-id="${offer._id}">Eliminar</button>
      </div>
    </div>`;

  container.appendChild(article);
}

// ── Eliminar oferta ──────────────────────────────────────────────────────
async function deleteOffer(id, btn) {
  if (!confirm('¿Seguro que quieres eliminar esta oferta?')) return;

  btn.disabled = true;
  btn.textContent = 'Eliminando…';

  try {
    const res = await fetchCsrf(`/api/ofertas/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok) {
      // Eliminar la card del DOM sin recargar todo
      const card = btn.closest('article[data-id]');
      if (card) card.remove();

      // Si ya no quedan cards, mostrar estado vacío
      const container = document.getElementById('offersContainer');
      if (!container.querySelector('article')) {
        container.innerHTML = `
          <div class="empty-state">
            <p>No tienes ofertas registradas aún.</p>
            <a class="btn" href="/commerce/new-offer">Crear primera oferta</a>
          </div>`;
      }

      showToast('Oferta eliminada correctamente');
    } else {
      showToast(data.message || 'Error al eliminar', 'err');
      btn.disabled = false;
      btn.textContent = 'Eliminar';
    }
  } catch (err) {
    console.error('Error eliminando oferta:', err);
    showToast('Error de conexión', 'err');
    btn.disabled = false;
    btn.textContent = 'Eliminar';
  }
}

// ── Sanitizar texto para evitar XSS al insertar en el DOM ───────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ── Delegación de eventos: evita onclick inline (bloqueado por CSP script-src-attr) ──
document.getElementById('offersContainer').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-delete-id]');
  if (btn) deleteOffer(btn.dataset.deleteId, btn);
});

// ── Iniciar ──────────────────────────────────────────────────────────────
loadOffers();
