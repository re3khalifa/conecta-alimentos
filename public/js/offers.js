const USER_ROLE = document.body.dataset.userRole || null;

async function fetchOffers(params) {
  const url = new URL("/api/ofertas", window.location.origin);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) {
      url.searchParams.set(k, v);
    }
  });

  const res = await fetch(url.toString());

  if (!res.ok) {
    let msg = "No se pudo obtener ofertas";
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

function mapsUrlFromOffer(o) {
  const lat = o?.location?.lat;
  const lng = o?.location?.lng;
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  return hasCoords
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
    : null;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str ?? ""));
  return d.innerHTML;
}

function noPhotoSvg() {
  return `<div class="no-photo">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M3 9l1-5h16l1 5M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M8 13a2 2 0 104 0 2 2 0 00-4 0z"/>
    </svg>
    <span>Sin foto</span>
  </div>`;
}

function statusStamp(o) {
  if (!o.expirationDate) return "";
  const exp = new Date(o.expirationDate);
  const now = new Date();
  const hoursLeft = (exp - now) / 36e5;
  if (hoursLeft < 0) return `<span class="stamp danger ticket-stamp">Vencida</span>`;
  if (hoursLeft <= 24) return `<span class="stamp warn ticket-stamp">Vence hoy</span>`;
  return `<span class="stamp ok ticket-stamp">Activa</span>`;
}

// 🔥 TEMPLATE LIMPIO (SIN commerce NI ID visible) — tarjeta de oferta
function cardTemplate(o) {
  const exp = o.expirationDate
    ? new Date(o.expirationDate).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
    : "N/D";

  const price = typeof o.price === "number" ? `$${o.price}` : "N/D";
  const qty = typeof o.quantity === "number" ? o.quantity : null;

  const id = o?._id;
  const hasId = typeof id === "string" && id.length > 5;

  const mapsUrl = mapsUrlFromOffer(o);

  return `
    <article class="ticket">
      <div class="ticket-media">
        ${
          o.image
            ? `<img src="${o.image}" alt="${escapeHtml(o.title)}" loading="lazy" />`
            : noPhotoSvg()
        }
        ${statusStamp(o)}
      </div>
      <div class="ticket-perf"></div>
      <div class="ticket-body">
        <span class="ticket-cat">${escapeHtml(o.category) || "Sin categoría"}</span>
        <h3 class="ticket-title">${escapeHtml(o.title) || "Sin título"}</h3>
        <p class="ticket-desc">${qty != null ? `${qty} disponibles` : "Cantidad no especificada"}</p>
        <div class="ticket-price-row">
          <span class="ticket-price">${price}<small>MXN</small></span>
          <span class="ticket-exp">Vence: ${exp}</span>
        </div>
        <div class="ticket-actions">
          ${
            hasId
              ? `<a class="btn btn-small detail-link" href="/ofertas/${id}">Ver detalle</a>`
              : `<span class="muted">Sin detalle</span>`
          }
          ${
            mapsUrl
              ? `<a class="btn btn-outline btn-small" href="${mapsUrl}" target="_blank">Mapa</a>`
              : ""
          }
        </div>
      </div>
    </article>
  `;
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
  }, 1500);
}

document.addEventListener("click", function (e) {
  const link = e.target.closest(".detail-link");

  if (!link) return;

  if (!USER_ROLE) {
    e.preventDefault();

    showToast("Debes iniciar sesión para ver detalles y reservar");

    setTimeout(() => {
      window.location.href = "/auth/login";
    }, 1500);
  }
});

/* ---------- Toggle UI ---------- */
const simpleBtn = document.getElementById("simpleBtn");
const advancedBtn = document.getElementById("advancedBtn");
const simpleBox = document.getElementById("simpleBox");
const advancedBox = document.getElementById("advancedBox");

function setMode(mode) {
  const isSimple = mode === "simple";

  simpleBox.style.display = isSimple ? "block" : "none";
  advancedBox.style.display = isSimple ? "none" : "block";

  simpleBtn.classList.toggle("btn-outline", !isSimple);
  advancedBtn.classList.toggle("btn-outline", isSimple);
}

simpleBtn.addEventListener("click", () => setMode("simple"));
advancedBtn.addEventListener("click", () => setMode("advanced"));

/* ---------- SIMPLE SEARCH ---------- */
const simpleForm = document.getElementById("simpleForm");
const simpleSearch = document.getElementById("simpleSearch");
const resultsSimple = document.getElementById("resultsSimple");
const emptySimple = document.getElementById("emptySimple");

async function runSimple() {
  resultsSimple.innerHTML = `<div class="muted">Cargando…</div>`;
  emptySimple.style.display = "none";

  try {
    const data = await fetchOffers({ search: simpleSearch.value.trim() });

    if (!Array.isArray(data) || data.length === 0) {
      resultsSimple.innerHTML = "";
      emptySimple.style.display = "block";
      return;
    }

    resultsSimple.innerHTML = data.map(cardTemplate).join("");
  } catch (e) {
    resultsSimple.innerHTML = `<div class="muted">Error: ${e.message}</div>`;
  }
}

simpleForm.addEventListener("submit", (e) => {
  e.preventDefault();
  runSimple();
});

/* ---------- ADVANCED SEARCH ---------- */
const formError = document.getElementById("formError");
const resultsEl = document.getElementById("results");
const emptyEl = document.getElementById("emptyState");

function getAdvancedValues() {
  return {
    search: document.getElementById("q").value.trim(),
    category: document.getElementById("category").value,
    sort: document.getElementById("sort").value,
    minPrice: document.getElementById("minPrice").value.trim(),
    maxPrice: document.getElementById("maxPrice").value.trim(),
    expiresBefore: document.getElementById("expiresBefore").value,
    minQty: document.getElementById("minQty").value.trim(),
  };
}

function validateAdvanced(values) {
  const minP = values.minPrice === "" ? null : Number(values.minPrice);
  const maxP = values.maxPrice === "" ? null : Number(values.maxPrice);

  if (minP !== null && Number.isNaN(minP)) return "Precio mínimo inválido.";
  if (maxP !== null && Number.isNaN(maxP)) return "Precio máximo inválido.";
  if (minP !== null && maxP !== null && minP > maxP)
    return "El precio mínimo no puede ser mayor al máximo.";

  return "";
}

async function runAdvanced() {
  const values = getAdvancedValues();
  const err = validateAdvanced(values);

  formError.textContent = err;
  if (err) return;

  resultsEl.innerHTML = `<div class="muted">Cargando…</div>`;
  emptyEl.style.display = "none";

  try {
    const data = await fetchOffers(values);

    if (!Array.isArray(data) || data.length === 0) {
      resultsEl.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }

    resultsEl.innerHTML = data.map(cardTemplate).join("");
  } catch (e) {
    resultsEl.innerHTML = `<div class="muted">Error: ${e.message}</div>`;
  }
}

document
  .getElementById("offerSearchForm")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    runAdvanced();
  });

document.getElementById("clearBtn").addEventListener("click", () => {
  ["q", "category", "sort", "minPrice", "maxPrice", "expiresBefore", "minQty"].forEach(
    (id) => {
      document.getElementById(id).value = "";
    }
  );

  formError.textContent = "";
  runAdvanced();
});

/* ---------- INIT ---------- */
setMode("simple");
runSimple();