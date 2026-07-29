document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');

  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      await fetchCsrf('/api/auth/logout', {
        method: 'POST'
      });
    } catch (e) {}

    window.location.href = '/auth/login';
  });
});