function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str ?? ""));
  return d.innerHTML;
}

async function loadReservations() {
  const container = document.getElementById("reservationsContainer");

  try {
    const res = await fetch("/api/reservas/mine");
    const data = await res.json();

    if (!data.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Todavía no has reservado ninguna oferta.</p>
          <a class="btn" href="/ofertas">Ver ofertas disponibles</a>
        </div>`;
      return;
    }

    container.innerHTML = data.map(r => {
      const expDate = r.offer?.expirationDate;
      const isExpired = expDate ? new Date(expDate) < new Date() : false;

      const stamp = isExpired
        ? `<span class="stamp danger ticket-stamp">Vencida</span>`
        : `<span class="stamp ok ticket-stamp">Activa</span>`;

      const media = r.offer?.image
        ? `<img src="${r.offer.image}" alt="${escapeHtml(r.offer.title)}" loading="lazy" />`
        : `<div class="no-photo">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l1-5h16l1 5M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M8 13a2 2 0 104 0 2 2 0 00-4 0z"/></svg>
             <span>Sin foto</span>
           </div>`;

      return `
        <article class="ticket">
          <div class="ticket-media">
            ${media}
            ${stamp}
          </div>
          <div class="ticket-perf"></div>
          <div class="ticket-body">
            <span class="ticket-cat">Reservado el ${new Date(r.createdAt).toLocaleDateString("es-MX")}</span>
            <h3 class="ticket-title">${escapeHtml(r.offer?.title) || "Sin título"}</h3>
            <p class="ticket-desc">${escapeHtml(r.offer?.description || "")}</p>
            <div class="ticket-price-row">
              <span class="ticket-exp">Caduca: ${expDate ? new Date(expDate).toLocaleDateString("es-MX") : "N/D"}</span>
            </div>
            <div class="ticket-actions">
              <a href="/ofertas/${r.offer._id}" class="btn btn-small">Ver detalle</a>
            </div>
          </div>
        </article>`;
    }).join("");

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state"><p>No se pudieron cargar tus reservas.</p></div>`;
  }
}

loadReservations();
