/**
 * Lee el valor de la cookie csrfToken (la pone el backend en cada
 * respuesta, ver middlewares/csrf.middleware.js). No es httpOnly a
 * propósito, para que este script sí pueda leerla.
 */
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Wrapper de fetch que agrega automáticamente el header X-CSRF-Token en
 * peticiones que modifican estado (POST/PUT/PATCH/DELETE). Úsalo igual que
 * fetch() normal.
 */
async function fetchCsrf(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const needsToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (needsToken) {
    options.headers = {
      ...(options.headers || {}),
      'X-CSRF-Token': getCsrfToken() || '',
    };
  }

  return fetch(url, options);
}
