const crypto = require('crypto');

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Emite una cookie csrfToken (no-httpOnly, para que el JS del frontend
 * pueda leerla) si el visitante todavía no tiene una. Se monta de forma
 * global, en TODAS las rutas, para que cualquier página cargada ya traiga
 * el token antes de que el usuario haga login, publique una oferta, etc.
 */
function issueCsrfToken(req, res, next) {
  let token = req.cookies[CSRF_COOKIE];

  if (!token) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // el frontend necesita poder leerlo para reenviarlo
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  req.csrfToken = token;
  next();
}

/**
 * Verifica, en peticiones que modifican estado (POST/PUT/PATCH/DELETE), que
 * el header X-CSRF-Token coincida con la cookie csrfToken. Un sitio externo
 * que intente forjar una petición (CSRF) no puede leer la cookie del
 * usuario por la política de mismo origen, así que no puede adivinar este
 * valor para mandarlo como header.
 */
function verifyCsrfToken(req, res, next) {
  if (req.headers.authorization?.startsWith('Bearer ')) return next();
  if (SAFE_METHODS.includes(req.method)) return next();

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Token CSRF inválido o ausente' });
  }

  next();
}

module.exports = { issueCsrfToken, verifyCsrfToken };
