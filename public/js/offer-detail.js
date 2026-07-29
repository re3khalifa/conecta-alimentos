const OFFER_ID = document.body.dataset.offerId;
const USER_ROLE = document.body.dataset.userRole;

function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str ?? ""));
  return d.innerHTML;
}

function showToast(message, type = "ok") {
  const msg = document.createElement("div");
  msg.className = `toast ${type}`;
  msg.textContent = message;
  document.body.appendChild(msg);
  requestAnimationFrame(() => msg.classList.add("show"));
  setTimeout(() => {
    msg.classList.remove("show");
    setTimeout(() => msg.remove(), 300);
  }, 2200);
}

function renderOfferImage(o) {
  const img = document.getElementById("offerImage");
  const placeholder = document.getElementById("offerImagePlaceholder");
  if (o.image) {
    img.src = o.image;
    img.alt = o.title || "Foto del producto";
    img.style.display = "block";
    placeholder.style.display = "none";
  } else {
    img.style.display = "none";
    placeholder.style.display = "flex";
  }
}

function statusStampFor(o) {
  if (!o.expirationDate) return "";
  const hoursLeft = (new Date(o.expirationDate) - new Date()) / 36e5;
  if (hoursLeft < 0) return `<span class="stamp danger">Vencida</span>`;
  if (hoursLeft <= 24) return `<span class="stamp warn">Vence hoy</span>`;
  return `<span class="stamp ok">Activa</span>`;
}

async function getOffer(id) {
  const res = await fetch(`/api/ofertas/${id}`);
  if (!res.ok) throw new Error("Oferta no encontrada");
  return res.json();
}
 
function fmtDate(d) {
  if (!d) return "N/D";
  return new Date(d).toLocaleDateString("es-MX");
}
 
function renderCard(o) {
  const price = typeof o.price === "number" ? `$${o.price}` : "N/D";
  const qty = typeof o.quantity === "number" ? o.quantity : "N/D";
  const canReserve = USER_ROLE === "user" && !alreadyReserved && o.quantity > 0;

  renderOfferImage(o);

  document.getElementById("detailCard").innerHTML = `
    ${statusStampFor(o)}
    <h2 class="page-title" style="margin-top:8px;">${escapeHtml(o.title) || "Sin título"}</h2>
    <p class="card-meta">${escapeHtml(o.category) || "Sin categoría"}</p>
    <p class="muted" style="margin-top:8px;">${escapeHtml(o.description) || ""}</p>

    <div class="ticket-price-row" style="margin-top:14px;">
      <span class="ticket-price">${price}<small>MXN</small></span>
      <span class="ticket-exp">${qty} disponibles</span>
    </div>

    <p class="muted" style="margin-top:10px; font-family:var(--font-mono); font-size:12.5px;">
      Caduca: ${fmtDate(o.expirationDate)}
    </p>
    <p class="muted" style="font-family:var(--font-mono); font-size:12.5px;">
      Dirección: ${escapeHtml(o.address) || "N/D"}
    </p>

    <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">
      <a class="btn btn-outline" href="/ofertas">Volver</a>
      ${canReserve
        ? `<button class="btn reserve-btn" data-offer-id="${o._id}">Reservar</button>`
        : alreadyReserved
          ? `<span class="muted" style="align-self:center;">Ya reservaste esta oferta</span>`
          : o.quantity <= 0
            ? `<span class="muted" style="align-self:center;">Sin stock</span>`
            : USER_ROLE
              ? ""
              : `<span class="muted" style="align-self:center;">Inicia sesión para reservar</span>`
      }
    </div>
  `;
}
 
/**
 * Google Maps por iframe (sin Google Cloud):
 * https://www.google.com/maps?q=lat,lng&output=embed
 */
function setGoogleMapsIframe(lat, lng) {
  const frame = document.getElementById("gmapFrame");
  const link = document.getElementById("gmapLink");
 
  if (typeof lat !== "number" || typeof lng !== "number") {
    // No coords
    frame.remove();
    link.style.display = "none";
    const wrap = document.querySelector(".map-embed");
    if (wrap) {
      wrap.innerHTML = `<div class="muted" style="padding:14px;">
        Esta oferta no tiene ubicación (lat/lng).
      </div>`;
    }
    return;
  }
 
  const q = `${lat},${lng}`;
  frame.src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  link.href = `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
}
 
/**
 * Open-Meteo (API de terceros real, sin key)
 */
async function loadWeather(lat, lng) {
  const box = document.getElementById("weatherBox");
 
  if (typeof lat !== "number" || typeof lng !== "number") {
    box.textContent = "No hay ubicación para consultar el clima.";
    return;
  }
 
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lng)}` +
      `&current=temperature_2m,precipitation,wind_speed_10m` +
      `&timezone=auto`;
 
    const res = await fetch(url);
    if (!res.ok) throw new Error("Open-Meteo no respondió");
    const data = await res.json();
 
    const c = data.current;
    if (!c) {
      box.textContent = "No se pudo obtener el clima.";
      return;
    }
 
    box.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap:12px;">
        <div class="card" style="padding:12px;">
          <div class="muted">Temperatura</div>
          <div style="font-size:22px; font-weight:900;">${c.temperature_2m}°C</div>
        </div>
        <div class="card" style="padding:12px;">
          <div class="muted">Lluvia</div>
          <div style="font-size:22px; font-weight:900;">${c.precipitation} mm</div>
        </div>
        <div class="card" style="padding:12px;">
          <div class="muted">Viento</div>
          <div style="font-size:22px; font-weight:900;">${c.wind_speed_10m} km/h</div>
        </div>
      </div>
      <p class="muted" style="margin-top:10px;">
        Actualizado: ${new Date(c.time).toLocaleString("es-MX")}
      </p>
    `;
  } catch (e) {
    box.textContent = `No se pudo cargar el clima: ${e.message}`;
  }
}
 
document.getElementById("detailCard").addEventListener("click", (e) => {
  const btn = e.target.closest(".reserve-btn");
  if (btn) reserveOffer(btn.dataset.offerId);
});

(async () => {
  try {
    // OFFER_ID viene del data-attribute en <body> (ver offer-detail.ejs)
    const offer = await getOffer(OFFER_ID);
 
    await checkIfReserved(offer._id);
    renderCard(offer);
 
    const lat = offer?.location?.lat;
    const lng = offer?.location?.lng;
 
    setGoogleMapsIframe(lat, lng);
    loadWeather(lat, lng);
  } catch (e) {
    document.getElementById("detailCard").innerHTML = `
      <h2 class="page-title">Oferta no encontrada</h2>
      <p class="muted">${escapeHtml(e.message)}</p>
      <a class="btn btn-outline" href="/ofertas" style="margin-top:12px;">Volver</a>
    `;
    const wb = document.getElementById("weatherBox");
    if (wb) wb.textContent = "No se pudo cargar el clima.";
  }
})();
 
async function reserveOffer(offerId) {
  try {
    const res = await fetchCsrf(`/api/reservas/${offerId}`, {
    method: "POST",
    credentials: "include"
    });
 
    const data = await res.json();
 
    if (res.ok) {
      showToast("Reserva realizada correctamente");
      setTimeout(() => location.reload(), 900);
    } else {
      showToast(data.message || "No se pudo reservar", "err");
    }
 
  } catch (err) {
    console.error(err);
    showToast("Error de conexión", "err");
  }
}
 
let alreadyReserved = false;
 
async function checkIfReserved(offerId) {
  try {
    const res = await fetch("/api/reservas/mine", {
    credentials: "include"
  });
    const data = await res.json();
 
    alreadyReserved = data.some(r => r.offer._id === offerId);
 
  } catch (err) {
    console.error("Error verificando reservas", err);
  }
}