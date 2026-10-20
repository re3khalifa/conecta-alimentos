// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = req.cookies?.token || bearerToken;
  // ...el resto de la función queda igual (jwt.verify, etc.)

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    return res.redirect('/auth/login');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub: userId, role, email }
    next();
  } catch (err) {
    res.clearCookie('token');
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    return res.redirect('/auth/login');
  }
};
