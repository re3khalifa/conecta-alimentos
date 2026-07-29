// middlewares/role.middleware.js
module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
      return res.redirect('/');
    }
    next();
  };
};