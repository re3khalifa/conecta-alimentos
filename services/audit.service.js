const AuditLog = require('../models/AuditLog');

/**
 * Registra un evento de auditoría. Nunca lanza ni bloquea la respuesta al
 * usuario: si guardar el log falla (ej. Mongo caído un instante), solo se
 * imprime en consola y la petición original sigue su curso normal.
 */
async function logEvent(event, req, extra = {}) {
  try {
    await AuditLog.create({
      event,
      user: req.user?.sub || extra.user || null,
      email: req.user?.email || extra.email || null,
      ip: req.ip,
      detail: extra.detail || null,
    });
  } catch (err) {
    console.error('No se pudo registrar evento de auditoría:', err.message);
  }
}

module.exports = { logEvent };
