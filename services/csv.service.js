// Utilidades para exportar CSV de forma segura.

// Evita que Excel ejecute una celda que empieza con = + - @ (inyección de fórmulas)
function csvCell(v) {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

// Une encabezado y filas; el BOM \uFEFF hace que Excel respete los acentos.
function toCsv(header, rows) {
  const lines = rows.map((r) => r.map(csvCell).join(','));
  return '\uFEFF' + [header.map(csvCell).join(','), ...lines].join('\r\n');
}

module.exports = { csvCell, toCsv };
