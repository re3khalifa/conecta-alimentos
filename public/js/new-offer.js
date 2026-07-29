const editMode = document.body.dataset.editMode === 'true';
const offerId  = document.body.dataset.offerId || '';

let selectedImageFile = null; // File nuevo elegido por el usuario (o null si no cambió)
let existingImageUrl = null;  // Imagen ya guardada en la oferta (modo edición)

// ── Elementos del formulario ────────────────────────────────────────────────
const imageInput   = document.getElementById('imageInput');
const dropzone     = document.getElementById('imageDropzone');
const imagePreview = document.getElementById('imagePreview');
const previewImg   = document.getElementById('imagePreviewImg');
const removeBtn    = document.getElementById('removeImageBtn');

const titleEl       = document.getElementById('title');
const categoryEl    = document.getElementById('category');
const descriptionEl = document.getElementById('description');
const priceEl       = document.getElementById('price');
const quantityEl    = document.getElementById('quantity');

// ── Vista previa en vivo de la oferta ───────────────────────────────────────
const previewTitle    = document.getElementById('previewTitle');
const previewCategory = document.getElementById('previewCategory');
const previewDesc     = document.getElementById('previewDesc');
const previewPrice    = document.getElementById('previewPrice');
const previewQty      = document.getElementById('previewQty');
const previewImgTag   = document.getElementById('previewImg');
const previewNoPhoto  = document.getElementById('previewNoPhoto');

function refreshLivePreview() {
  previewTitle.textContent = titleEl.value.trim() || 'Título de la oferta';
  previewCategory.textContent = categoryEl.value || 'Categoría';
  previewDesc.textContent = descriptionEl.value.trim() || 'La descripción aparecerá aquí.';
  const price = parseFloat(priceEl.value);
  previewPrice.innerHTML = `${!isNaN(price) ? `$${price}` : '$0'}<small>MXN</small>`;
  const qty = parseInt(quantityEl.value, 10);
  previewQty.textContent = !isNaN(qty) ? `${qty} disponibles` : '— disponibles';
}

[titleEl, categoryEl, descriptionEl, priceEl, quantityEl].forEach((el) =>
  el.addEventListener('input', refreshLivePreview)
);

function showImagePreview(src) {
  previewImg.src = src;
  imagePreview.style.display = 'block';
  previewImgTag.src = src;
  previewImgTag.style.display = 'block';
  previewNoPhoto.style.display = 'none';
}

function clearImagePreview() {
  previewImg.src = '';
  imagePreview.style.display = 'none';
  previewImgTag.src = '';
  previewImgTag.style.display = 'none';
  previewNoPhoto.style.display = 'flex';
}

function handleFile(file) {
  if (!file) return;
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    document.getElementById('formMsg').textContent = 'Formato no permitido. Usa JPG, PNG o WEBP.';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    document.getElementById('formMsg').textContent = 'La imagen supera el tamaño máximo de 5 MB.';
    return;
  }
  document.getElementById('formMsg').textContent = '';
  selectedImageFile = file;

  const reader = new FileReader();
  reader.onload = (e) => showImagePreview(e.target.result);
  reader.readAsDataURL(file);
}

imageInput.addEventListener('change', () => handleFile(imageInput.files[0]));

// Drag & drop
['dragover', 'dragenter'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  })
);
['dragleave', 'drop'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  })
);
dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) handleFile(file);
});

removeBtn.addEventListener('click', () => {
  selectedImageFile = null;
  existingImageUrl = null;
  imageInput.value = '';
  clearImagePreview();
});

// ── Geocoding con Nominatim (OpenStreetMap, sin API key) ──────────────────
let geoTimer = null;

document.getElementById('address').addEventListener('input', () => {
  clearTimeout(geoTimer);
  const val = document.getElementById('address').value.trim();

  // Limpiar coords si borra la dirección
  if (!val) {
    document.getElementById('lat').value = '';
    document.getElementById('lng').value = '';
    document.getElementById('mapPreview').style.display = 'none';
    document.getElementById('geoMsg').textContent = '';
    return;
  }

  document.getElementById('geoMsg').textContent = 'Buscando ubicación…';

  // Esperar 800ms después de que el usuario deje de escribir
  geoTimer = setTimeout(() => geocode(val), 800);
});

async function geocode(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=mx`;
    const res  = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    const data = await res.json();

    if (!data.length) {
      document.getElementById('geoMsg').textContent = '⚠️ No se encontró la dirección. El mapa no se mostrará.';
      document.getElementById('lat').value = '';
      document.getElementById('lng').value = '';
      document.getElementById('mapPreview').style.display = 'none';
      return;
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;
    document.getElementById('geoMsg').textContent = `✅ Ubicación encontrada: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    // Mostrar preview del mapa
    const q = `${lat},${lng}`;
    document.getElementById('mapFrame').src =
      `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    document.getElementById('mapPreview').style.display = 'block';

  } catch (err) {
    document.getElementById('geoMsg').textContent = 'No se pudo obtener la ubicación.';
  }
}

// ── Modo edición: cargar datos existentes ─────────────────────────────────
if (editMode && offerId) {
  fetch(`/api/ofertas/${offerId}`)
    .then(r => r.json())
    .then(offer => {
      titleEl.value       = offer.title        || '';
      categoryEl.value    = offer.category     || '';
      descriptionEl.value = offer.description  || '';
      priceEl.value       = offer.price        != null ? offer.price : '';
      quantityEl.value    = offer.quantity     != null ? offer.quantity : '';
      document.getElementById('address').value = offer.address || '';

      if (offer.expirationDate) {
        document.getElementById('expirationDate').value =
          new Date(offer.expirationDate).toISOString().split('T')[0];
      }

      if (offer.image) {
        existingImageUrl = offer.image;
        showImagePreview(offer.image);
      }

      // Si ya tiene coordenadas, cargarlas y mostrar el mapa
      if (offer.location?.lat && offer.location?.lng) {
        const lat = offer.location.lat;
        const lng = offer.location.lng;
        document.getElementById('lat').value = lat;
        document.getElementById('lng').value = lng;
        document.getElementById('geoMsg').textContent =
          `✅ Ubicación: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        const q = `${lat},${lng}`;
        document.getElementById('mapFrame').src =
          `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
        document.getElementById('mapPreview').style.display = 'block';
      }

      refreshLivePreview();
    })
    .catch(() => {
      document.getElementById('formMsg').textContent = 'Error al cargar los datos de la oferta.';
    });
}

// ── Submit ────────────────────────────────────────────────────────────────
document.getElementById('offerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const msg = document.getElementById('formMsg');
  const btn = document.getElementById('submitBtn');
  msg.textContent = '';
  btn.disabled = true;
  btn.textContent = editMode ? 'Guardando…' : 'Publicando…';

  const latVal = parseFloat(document.getElementById('lat').value);
  const lngVal = parseFloat(document.getElementById('lng').value);

  // multipart/form-data, para poder incluir la imagen del producto
  const formData = new FormData();
  formData.append('title', titleEl.value.trim());
  formData.append('category', categoryEl.value);
  formData.append('description', descriptionEl.value.trim());
  formData.append('price', parseFloat(priceEl.value) || 0);
  formData.append('quantity', parseInt(quantityEl.value, 10) || 0);
  formData.append('expirationDate', document.getElementById('expirationDate').value);
  formData.append('address', document.getElementById('address').value.trim());

  if (!isNaN(latVal) && !isNaN(lngVal)) {
    formData.append('lat', latVal);
    formData.append('lng', lngVal);
  }

  // Solo se envía el archivo si el usuario eligió uno nuevo; si no, el
  // backend conserva la imagen ya guardada (modo edición).
  if (selectedImageFile) {
    formData.append('image', selectedImageFile);
  }

  const url    = editMode ? `/api/ofertas/${offerId}` : '/api/ofertas';
  const method = editMode ? 'PUT' : 'POST';

  try {
    // OJO: no fijar 'Content-Type' a mano — el navegador debe generar el
    // boundary de multipart/form-data automáticamente.
    const res = await fetchCsrf(url, {
      method,
      body: formData,
    });

    const result = await res.json();

    if (res.ok) {
      window.location.href = '/commerce/offers';
    } else if (res.status === 401) {
      window.location.href = '/auth/login';
    } else {
      msg.textContent = result.message || 'Error al guardar la oferta.';
      btn.disabled = false;
      btn.textContent = editMode ? 'Guardar cambios' : 'Publicar oferta';
    }
  } catch (err) {
    console.error('Error:', err);
    msg.textContent = 'Error de conexión. Intenta de nuevo.';
    btn.disabled = false;
    btn.textContent = editMode ? 'Guardar cambios' : 'Publicar oferta';
  }
});

refreshLivePreview();
