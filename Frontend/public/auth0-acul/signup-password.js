const SDK_BASE = 'https://cdn.jsdelivr.net/npm/@auth0/auth0-acul-js@1.8.0';
const STYLESHEET_URL = 'https://kfc-frontend-pages.pages.dev/auth0-acul/assets/styles.css?v=4';

function loadStylesheet() {
  if (document.querySelector(`link[href^="${STYLESHEET_URL}"]`)) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = STYLESHEET_URL;
  stylesheet.crossOrigin = 'anonymous';
  document.head.appendChild(stylesheet);
}

function getContext() {
  return window.universal_login_context || {};
}

function renderPassword() {
  if (!document.body) return null;

  loadStylesheet();

  document.body.innerHTML = `
    <main class="auth-shell kfc-profile-shell">
      <div class="brand">KFC Rewards</div>
      <div class="setup-progress"><span>1</span><i></i><span class="active">2</span></div>
      <div class="progress-labels"><span>Profile</span><span>Verify</span></div>
      <h1>Create your password</h1>
      <p class="subtitle">Choose a secure password to finish setting up your account.</p>
      <p class="helper requirement" style="margin: 0 0 12px; color: #6b6b6b; text-align: left; font-weight: 600;">Password must be at least 15 characters long.</p>
      <form data-password-form>
        <label class="field"><span>Password *</span><input name="password" type="password" autocomplete="new-password" minlength="15" pattern="^.{15,}$" required></label>
        <label class="field"><span>Confirm password *</span><input name="confirmation" type="password" autocomplete="new-password" minlength="15" pattern="^.{15,}$" required></label>

        <div style="margin-top: 16px; color: #4b4b4b; font-size: 15px; line-height: 1.8;">
          <div style="font-weight: 700; margin-bottom: 10px;">Password must contain:</div>
          <div style="display: flex; align-items: center; gap: 10px; margin: 6px 0;"><span style="display:inline-block; width: 16px; height: 16px; border: 2px solid #7a7a7a; border-radius: 50%;"></span>Min. 15 characters</div>
          <div style="display: flex; align-items: center; gap: 10px; margin: 6px 0;"><span style="display:inline-block; width: 16px; height: 16px; border: 2px solid #7a7a7a; border-radius: 50%;"></span>One uppercase (A-Z) &amp; lowercase (a-z)</div>
          <div style="display: flex; align-items: center; gap: 10px; margin: 6px 0;"><span style="display:inline-block; width: 16px; height: 16px; border: 2px solid #7a7a7a; border-radius: 50%;"></span>One number (0-9)</div>
          <div style="display: flex; align-items: center; gap: 10px; margin: 6px 0;"><span style="display:inline-block; width: 16px; height: 16px; border: 2px solid #7a7a7a; border-radius: 50%;"></span>One special character (e.g. !@#$%^&amp;*)</div>
        </div>

        <p class="helper" data-error style="display: none; margin-top: 12px; color: #b80020; text-align: left; font-weight: 600;">&nbsp;</p>
        <button type="submit">Create account</button>
      </form>
    </main>`;
  return document.querySelector('[data-password-form]');
}

function showPasswordError(form, message) {
  const error = form.querySelector('[data-error]');
  if (!error) return;
  error.textContent = message;
  error.style.display = 'block';
  error.hidden = false;
}

function clearPasswordError(form) {
  const error = form.querySelector('[data-error]');
  if (!error) return;
  error.textContent = '';
  error.style.display = 'none';
  error.hidden = true;
}

function validatePasswordForm(form) {
  const formData = new FormData(form);
  const password = String(formData.get('password') || '');
  const confirmation = String(formData.get('confirmation') || '');

  if (!password || !confirmation) {
    return 'Please enter and confirm your password.';
  }

  if (!/^.{15,}$/.test(password)) {
    return 'Password must be at least 15 characters long.';
  }

  if (password !== confirmation) {
    return 'Passwords do not match.';
  }

  return '';
}

async function loadSignupManager() {
  try {
    const module = await import(`${SDK_BASE}/signup-password/+esm`);
    return new module.default();
  } catch (error) {
    console.error('Failed to load Auth0 signup-password module:', error);
    return null;
  }
}

async function startSignupPassword() {
  const form = renderPassword();
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearPasswordError(form);

    const validationError = validatePasswordForm(form);
    if (validationError) {
      showPasswordError(form, validationError);
      return;
    }

    const formData = new FormData(form);
    const password = String(formData.get('password') || '');

    try {
      const manager = await loadSignupManager();
      if (!manager) {
        showPasswordError(form, 'The password signup module could not be loaded. Please refresh and try again.');
        return;
      }

      const data = manager.screen?.data || getContext().screen?.data || {};
      const email = data.email || data.identifier || '';
      const username = data.username || '';
      const phone = data.phone_number || data.phoneNumber || data.phone || '';

      if (!email || !password) {
        throw new Error('Auth0 did not provide the signup email or password.');
      }

      clearPasswordError(form);
      await manager.signup({
        email,
        ...(username ? { username } : {}),
        ...(phone ? { phone } : {}),
        password,
      });
    } catch (signupError) {
      console.error('Auth0 password signup failed:', signupError);
      const managerErrors = signupError?.message || signupError?.error_description || 'Unable to create your account. Please try again.';
      showPasswordError(form, managerErrors);
    }
  });

  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      const validationError = validatePasswordForm(form);
      if (!validationError) {
        clearPasswordError(form);
        return;
      }

      const password = String(new FormData(form).get('password') || '');
      const confirmation = String(new FormData(form).get('confirmation') || '');
      if (!password || !confirmation) {
        return;
      }

      showPasswordError(form, validationError);
    });
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
