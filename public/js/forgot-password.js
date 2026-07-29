document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = document.getElementById('formMsg');
  const email = document.getElementById('email').value.trim();

  if (!email) {
    msg.style.color = 'var(--brasa)';
    msg.textContent = 'Ingresa tu correo electrónico.';
    return;
  }

  // Nota: la recuperación de contraseña por correo aún no está conectada a
  // un backend real en esta versión de la plataforma.
  msg.style.color = 'var(--milpa)';
  msg.textContent = 'Si existe una cuenta con ese correo, pronto recibirás instrucciones.';
});
