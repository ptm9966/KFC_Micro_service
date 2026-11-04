const SDK_BASE = 'https://cdn.jsdelivr.net/npm/@auth0/auth0-acul-js@1.8.0';
const STYLESHEET_URL = 'https://kfc-frontend-pages.pages.dev/auth0-acul/assets/styles.css?v=3';

function loadStylesheet() {
  if (document.querySelector(`link[href^="${STYLESHEET_URL}"]`)) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = STYLESHEET_URL;
  stylesheet.crossOrigin = 'anonymous';
  document.head.appendChild(stylesheet);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function getContext() {
  return window.universal_login_context || {};
}

function getEmail() {
  const context = getContext();
  const authorizationParams = context.untrusted_data?.authorization_params
    || context.untrustedData?.authorizationParams
    || {};
  const submittedFormData = context.untrusted_data?.submitted_form_data
    || context.untrustedData?.submittedFormData
    || {};

  return authorizationParams.login_hint
    || authorizationParams['ext-email']
    || submittedFormData.email
    || '';
}

function renderProfile() {
  loadStylesheet();
  document.body.innerHTML = `
    <main class="auth-shell kfc-profile-shell">
      <div class="brand">KFC Rewards</div>
      <div class="setup-progress"><span class="active">1</span><i></i><span>2</span></div>
      <div class="progress-labels"><span>Profile</span><span>Verify</span></div>
      <h1>Set up your account</h1>
      <p class="subtitle">Complete your profile to continue.</p>
      <form data-profile-form>
        <label class="field"><span>First name *</span><input name="firstName" autocomplete="given-name" required></label>
        <label class="field"><span>Last name *</span><input name="lastName" autocomplete="family-name" required></label>
        <label class="field"><span>Email *</span><input name="email" type="email" value="${escapeHtml(getEmail())}" readonly required></label>
        <label class="field"><span>Mobile number *</span><input name="phone" type="tel" autocomplete="tel" required></label>
        <label class="field"><span>Username *</span><input name="username" autocomplete="username" required></label>
        <p class="helper" data-error hidden></p>
        <button type="submit">Continue</button>
      </form>
    </main>`;
  return document.querySelector('[data-profile-form]');
}

async function loadSignupManager() {
  try {
    const module = await import(`${SDK_BASE}/signup-id/+esm`);
    return new module.default();
  } catch (error) {
    console.error('Failed to load Auth0 signup-id module:', error);
    return null;
  }
}

function validateProfileForm(form) {
  const formData = new FormData(form);
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const username = String(formData.get('username') || '').trim();

  if (!firstName) return 'First name is required.';
  if (!lastName) return 'Last name is required.';
  if (!email) return 'Email is required.';
  if (!phone) return 'Mobile number is required.';
  if (!username) return 'Username is required.';
  if (phone.replace(/\D/g, '').length < 10) return 'Please enter a valid mobile number.';
  if (username.length < 3) return 'Username must be at least 3 characters long.';
  return '';
}

async function startSignup() {
  const form = renderProfile();
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = form.querySelector('[data-error]');
    error.hidden = true;

    const validationError = validateProfileForm(form);
    if (validationError) {
      error.textContent = validationError;
      error.hidden = false;
      return;
    }

    try {
      const manager = await loadSignupManager();
      if (!manager) {
        error.textContent = 'The signup module could not be loaded. Please refresh the page and try again.';
        error.hidden = false;
        return;
      }

      const formData = new FormData(form);
      await manager.signup({
        email: formData.get('email'),
        phone: formData.get('phone'),
        username: formData.get('username'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
      });
    } catch (signupError) {
      console.error('Auth0 signup failed:', signupError);
      error.textContent = 'Unable to continue with signup. Please try again.';
      error.hidden = false;
    }
  });
}

startSignup().catch((error) => console.error('ACUL signup screen failed:', error));