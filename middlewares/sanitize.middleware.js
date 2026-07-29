/**
 * Sanitiza recursivamente cualquier clave que empiece con "$" o contenga "."
 * en body/params/query, para prevenir inyección de operadores de MongoDB
 * (ej. { "email": { "$ne": null } } para saltarse un login).
 *
 * OJO: a diferencia del paquete express-mongo-sanitize, esta versión MUTA
 * los objetos en su lugar (no reasigna req.query = ...), porque en Express 5
 * `req.query` es una propiedad de solo lectura (solo tiene getter) y
 * reasignarla lanza "Cannot set property query of #<IncomingMessage> which
 * has only a getter" — así falla express-mongo-sanitize@2.x con Express 5.
 */
function sanitizeValue(value) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = sanitizeValue(value[i]);
    }
    return value;
  }

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
        continue;
      }
      value[key] = sanitizeValue(value[key]);
    }
    return value;
  }

  return value;
}

module.exports = function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') sanitizeValue(req.body);
  if (req.params && typeof req.params === 'object') sanitizeValue(req.params);
  if (req.query && typeof req.query === 'object') sanitizeValue(req.query);
  next();
};
