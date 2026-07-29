const multer = require('multer');

module.exports = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  // Si ya se mandó respuesta, delega
  if (res.headersSent) return next(err);

  // Errores de subida de archivos (Multer): tamaño excedido o tipo inválido
  if (err instanceof multer.MulterError || /Formato de imagen no permitido/.test(err.message || '')) {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen supera el tamaño máximo permitido (5 MB).'
      : err.message || 'No se pudo procesar la imagen.';
    return res.status(400).json({ message: msg });
  }

  const status = err.statusCode || err.status || 500;

  // ¿Es petición API?
  const wantsJson =
    req.originalUrl.startsWith("/api") ||
    (req.headers.accept && req.headers.accept.includes("application/json"));

  // =========================
  // RESPUESTA PARA API (JSON)
  // =========================
  if (wantsJson) {
    return res.status(status).json({
      message: err.message || "Error interno del servidor",
      status,
    });
  }

  // =========================
  // RESPUESTA PARA WEB (EJS)
  // =========================
  // Si no es 500, redirige a 404 u otra página genérica
  if (status !== 500) {
    return res.status(status).render("errors/404", {
      title: status,
    });
  }

  // Error 500
  return res.status(500).render("errors/500", {
    title: "Error",
    message: err.message || "Ocurrió un error inesperado. Intenta más tarde.",
  });
};

