/**
 * Auth menu - displays login/logout based on user session
 */

async function updateAuthMenu() {
  try {
    const response = await fetch('/api/auth/user');
    const data = await response.json();

    const loginLink = document.querySelector('[data-auth-login]');
    const userSection = document.querySelector('[data-auth-user]');
    const usernameLink = document.querySelector('[data-username]');

    if (data.user) {
      // User is logged in
      if (loginLink) loginLink.style.display = 'none';
      if (userSection) userSection.style.display = 'inline';
      if (usernameLink) usernameLink.textContent = data.user.username;
    } else {
      // User is not logged in
      if (loginLink) loginLink.style.display = 'inline';
      if (userSection) userSection.style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to fetch user session:', error);
    // Show login link on error
    const loginLink = document.querySelector('[data-auth-login]');
    if (loginLink) loginLink.style.display = 'inline';
  }
}

// Update on page load
updateAuthMenu();

