require('dotenv').config();
 
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
 
const app = express();

// Render (y cualquier PaaS detrás de un balanceador) reenvía X-Forwarded-For.
// Sin esto, express-rate-limit lanza ERR_ERL_UNEXPECTED_X_FORWARDED_FOR y
// /api/auth/login responde 500 en producción aunque funcione en localhost.
app.set('trust proxy', 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
  }
});
 
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
 
if (!MONGO_URI) {
  console.error('Falta MONGO_URI en tu .env');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en tu .env');
  process.exit(1);
}
 
// ── Seguridad ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        // Nominatim (geocoding) y Open-Meteo (clima) son llamados por fetch()
        // desde el navegador; sin esto, connect-src 'self' los bloquea.
        connectSrc: [
          "'self'",
          "https://nominatim.openstreetmap.org",
          "https://api.open-meteo.com"
        ],
        // Sin frameSrc, el navegador cae a default-src 'self' y bloquea el
        // <iframe> de Google Maps por completo.
        frameSrc: ["'self'", "https://www.google.com"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"]
      }
    }
  })
);
app.use(cors());
app.use(cookieParser());
 
// ── Body parsers + archivos estáticos ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('./middlewares/sanitize.middleware')); // anti-inyección NoSQL

const { issueCsrfToken, verifyCsrfToken } = require('./middlewares/csrf.middleware');
app.use(issueCsrfToken);
app.use(verifyCsrfToken);

// Endpoint explícito para obtener el token CSRF (clientes que no cargan HTML primero)
app.get('/api/csrf-token', (req, res) => res.json({ csrfToken: req.csrfToken }));

app.use(express.static(path.join(__dirname, 'public')));
app.get('/.well-known/security.txt', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'public', 'security.txt')
  );
});
// ── Vistas ───────────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
 
// ── Usuario disponible en todos los templates EJS ───────────────────────────
// Lee la cookie, verifica el JWT y pone res.locals.user en cada vista.
// Si no hay token o es inválido, res.locals.user queda en null.
app.use((req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      res.locals.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});
 
// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/', require('./routes/web.routes'));
app.use('/api/ofertas', require('./routes/offer.routes'));
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/commerce', require('./routes/commerce.routes'));
app.use("/api/reservas", require("./routes/reservation.routes"));
app.use("/api/soap", require("./routes/soap.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
 
// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('errors/404', { title: '404' });
});
 
// ── Error handler global (debe ir al final) ──────────────────────────────────
app.use(require('./middlewares/error.middleware'));
 
// ── Conexión a MongoDB y arranque del servidor ───────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
 
