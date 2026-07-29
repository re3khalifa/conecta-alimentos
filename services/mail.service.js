async function sendMail(to, subject, html) {
  console.log("=== CORREO SIMULADO ===");
  console.log("Para:", to);
  console.log("Asunto:", subject);

  return {
    success: true
  };
}

module.exports = { sendMail };