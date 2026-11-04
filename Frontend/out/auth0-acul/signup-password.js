const SDK_BASE = 'https://cdn.jsdelivr.net/npm/@auth0/auth0-acul-js@1.8.0';

function getContext() {
  return window.universal_login_context || {};
}

function renderPassword() {
  if (!document.body) return null;

  document.body.innerHTML = `
    <main class="auth-shell kfc-profile-shell">
      <div class="brand">KFC Rewards</div>
      <div class="setup-progress"><span>1</span><i></i><span class="active">2</span></div>
      <div class="progress-labels"><span>Profile</span><span>Verify</span></div>
      <h1>Create your password</h1>
      <p class="subtitle">Choose a secure password to finish setting up your account.</p>
      <form data-password-form>
        <label class="field"><span>Password *</span><input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
        <label class="field"><span>Confirm password *</span><input name="confirmation" type="password" autocomplete="new-password" minlength="8" required></label>
        <p class="helper" data-error hidden></p>
        <button type="submit">Create account</button>
      </form>
    </main>`;
  return document.querySelector('[data-password-form]');
}

async function loadSignupManager() {
  const module = await import(`${SDK_BASE}/signup-password/+esm`);
  return new module.default();
}

async function startSignupPassword() {
  const form = renderPassword();
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const error = form.querySelector('[data-error]');
    const password = String(formData.get('password') || '');
    const confirmation = String(formData.get('confirmation') || '');
    error.hidden = true;

    if (password !== confirmation) {
      error.textContent = 'Passwords do not match.';
      error.hidden = false;
      return;
    }

    try {
      const manager = await loadSignupManager();
      const data = manager.screen?.data || getContext().screen?.data || {};
      const email = data.email || data.identifier || '';
      const username = data.username || '';
      const phone = data.phone_number || data.phoneNumber || data.phone || '';

      if (!email || !password) {
        throw new Error('Auth0 did not provide the signup email or password.');
      }

      await manager.signup({
        email,
        ...(username ? { username } : {}),
        ...(phone ? { phone } : {}),
        password,
      });
    } catch (signupError) {
      console.error('Auth0 password signup failed:', signupError);
      const managerErrors = signupError?.message || signupError?.error_description || 'Unable to create your account. Please try again.';
      error.textContent = managerErrors;
      error.hidden = false;
    }
  });
}

function startWhenReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startSignupPassword().catch((error) => console.error('ACUL password screen failed:', error));
    }, { once: true });
    return;
  }

  startSignupPassword().catch((error) => console.error('ACUL password screen failed:', error));
}

startWhenReady();
