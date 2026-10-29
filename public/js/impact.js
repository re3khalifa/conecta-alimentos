function esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str ?? ''));
  return d.innerHTML;
}
const nf = new Intl.NumberFormat('es-MX');

async function loadImpact() {
  const box = document.getElementById('impactStats');
  if (!box) return;
  const card = document.getElementById('impactCard'); // se muestra solo si hay permiso
  const hide = () => { if (card) card.remove(); };

  try {
    const res = await fetch('/api/impacto');
    // Sin sesión (401) o usuario normal (403): estas cifras no son para esa persona.
    if (res.status === 401 || res.status === 403) return hide();
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();

    // La página pública de ODS solo muestra las cifras globales (admin);
    // un comercio ve sus cifras propias en su panel.
    if (box.dataset.only === 'global' && d.alcance !== 'global') return hide();
    if (card) card.style.display = '';
    const propio = d.alcance === 'propio';

    const metrics = [
      [d.unidadesRescatadas, propio ? 'Unidades reservadas' : 'Unidades rescatadas'],
      [d.reservas.activas, 'Reservas activas'],
      [d.ofertas.total, propio ? 'Mis ofertas' : 'Ofertas publicadas'],
      [d.ofertas.activas, 'Ofertas disponibles hoy'],
      ...(propio ? [] : [[d.comercios, 'Comercios participantes']]),
      ['$' + nf.format(d.valorReservado), 'Valor reservado (MXN)'],
    ];

    const maxCat = Math.max(1, ...d.porCategoria.map((c) => c.unidades));
    const cats = d.porCategoria.length
      ? d.porCategoria.map((c) => `
          <div class="hbar">
            <span>${esc(c.categoria)}</span>
            <div class="track"><div class="fill" style="width:${(c.unidades / maxCat) * 100}%"></div></div>
            <strong>${nf.format(c.unidades)}</strong>
          </div>`).join('')
      : '<p class="muted">Todavía no hay reservas para mostrar.</p>';

    const maxDay = Math.max(1, ...d.ultimos14dias.map((x) => x.unidades));
    const days = d.ultimos14dias.map((x) => `
      <div class="col" title="${esc(x.fecha)}: ${x.unidades} unidades">
        <span>${x.unidades || ''}</span>
        <div class="bar" style="height:${(x.unidades / maxDay) * 100}%"></div>
        <span>${esc(x.fecha.slice(8))}</span>
      </div>`).join('');

    box.innerHTML = `
      <div class="metric-grid">
        ${metrics.map(([n, l]) => `<div class="metric"><div class="num">${typeof n === 'number' ? nf.format(n) : n}</div><div class="lbl">${l}</div></div>`).join('')}
      </div>
      <h3 class="chart-title">${propio ? 'Mis unidades reservadas por categoría' : 'Unidades rescatadas por categoría'}</h3>
      ${cats}
      <h3 class="chart-title">Unidades reservadas en los últimos 14 días</h3>
      <div class="vbars">${days}</div>
      <p class="muted" style="margin-top:14px; font-size:13px;">${propio ? 'Cifras de las reservas activas en tus ofertas.' : 'Cifras calculadas en vivo con las reservas activas de la plataforma.'} Las reservas canceladas no cuentan.</p>`;
  } catch (e) {
    console.error(e);
    box.innerHTML = '<p class="muted">No se pudieron cargar las estadísticas por ahora.</p>';
  }
}

loadImpact();
