const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendMail } = require('../services/mail.service');
const { logEvent } = require('../services/audit.service');

const COOKIE_NAME = 'token';

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  if (!secret) {
    throw new Error('Falta JWT_SECRET en .env');
  }

  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    secret,
    { expiresIn }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, role, privacyAccepted } = req.body;

    if (!privacyAccepted) {
      return res.status(400).json({
        message: 'Debes aceptar el aviso de privacidad'
      });
    }


    // Verificar si ya existe
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hash seguro
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
    email,
    passwordHash,
    role: ['user', 'commerce'].includes(role) ? role : 'user',
    privacyAccepted: true,
    privacyAcceptedAt: new Date()
  });

    // Enviar correo de bienvenida
    try {
    await sendMail(
    user.email,
    'Bienvenido a Conecta Alimentos',
    `
      <h2>Bienvenido a Conecta Alimentos</h2>
      <p>Tu cuenta fue creada correctamente.</p>
    `
    );
  } catch (error) {
  console.error('Error enviando correo:', error.message);
}

    // No devolver passwordHash
    await logEvent('auth.register', req, { user: user._id, email: user.email, detail: { role: user.role } });

    return res.status(201).json({
      message: 'Usuario registrado',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    // No revelar si el email existe o no (buena práctica)
    if (!user) {
      await logEvent('auth.login.failed', req, { email, detail: { reason: 'usuario no encontrado' } });
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await logEvent('auth.login.failed', req, { user: user._id, email, detail: { reason: 'contraseña incorrecta' } });
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = signToken(user);

    // Cookie HttpOnly (seguridad básica)
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    });

    await logEvent('auth.login.success', req, { user: user._id, email: user.email });

    return res.status(200).json({
      message: 'Login correcto',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.logout = async (req, res) => {
  // req.user no existe aquí (esta ruta no pasa por requireAuth), así que
  // intentamos identificar al usuario a partir de la cookie antes de
  // borrarla, solo para fines de auditoría — si el token ya venció o es
  // inválido, simplemente se registra el logout sin identidad.
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { sub: payload.sub, email: payload.email };
    }
  } catch (_) {
    // token inválido/expirado: no pasa nada, se audita sin identidad
  }

  await logEvent('auth.logout', req);
  res.clearCookie(COOKIE_NAME);
  return res.status(200).json({ message: 'Sesión cerrada' });
};