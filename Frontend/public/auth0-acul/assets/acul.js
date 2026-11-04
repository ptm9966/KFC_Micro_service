const SDK_VERSION = '1.8.0';
const SDK_BASE = `https://cdn.jsdelivr.net/npm/@auth0/auth0-acul-js@${SDK_VERSION}`;

async function loadManager(screenName) {
  const module = await import(`${SDK_BASE}/${screenName}/+esm`);
  return new module.default();
}

function getScreenName() {
  const context = window.universal_login_context || {};
  const contextScreen = context.screen?.name || context.screen?.data?.screenName;
  if (contextScreen) return contextScreen;

  const path = window.location.pathname;
  if (path.includes('/u/signup')) return 'signup-id';
  if (path.includes('/u/login')) return 'login-id';
  if (path.includes('/u/reset-password')) return 'reset-password';
  return '';
}

function showError(container, message) {
  const error = container.querySelector('[data-error]');
  error.textContent = message;
  error.hidden = false;
}

function renderSignupProfile(email) {
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
        <label class="field"><span>Email *</span><input name="email" type="email" value="${email.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" readonly required></label>
        <label class="field"><span>Mobile number *</span><input name="phone" type="tel" autocomplete="tel" required></label>
        <label class="field"><span>Username *</span><input name="username" autocomplete="username" required></label>
        <p class="helper" data-error hidden></p>
        <button type="submit">Continue</button>
      </form>
    </main>`;
  return document.querySelector('[data-profile-form]');
}

async function start() {
  const screenName = getScreenName();
  if (!screenName) return;

  const context = window.universal_login_context || {};
  const email = context.untrusted_data?.authorization_params?.login_hint || '';
  const form = screenName === 'signup-id'
    ? renderSignupProfile(email)
    : document.querySelector('form');
  if (!form) return;

  if (screenName === 'signup-id') {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);

      try {
        const manager = await loadManager(screenName);
        await manager.signup({
          email: formData.get('email'),
          phone: formData.get('phone') || undefined,
          username: formData.get('username') || undefined,
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
        });
      } catch (error) {
        console.error('Auth0 signup failed:', error);
        showError(form, 'Unable to continue with signup. Please try again.');
      }
    });
    return;
  }

  try {
    const manager = await loadManager(screenName);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);

      if (screenName === 'login-id') {
        await manager.login({ identifier: formData.get('identifier') });
      } else if (screenName === 'login-password') {
        await manager.login({
          username: manager.screen.data?.username || manager.screen.data?.email,
          password: formData.get('password'),
        });
      } else if (screenName === 'signup-password') {
        await manager.signup({
          email: manager.screen.data?.email,
          username: manager.screen.data?.username,
          phone: manager.screen.data?.phoneNumber,
          password: formData.get('password'),
        });
      } else if (screenName === 'reset-password') {
        await manager.resetPassword({
          'password-reset': formData.get('password-reset'),
          're-enter-password': formData.get('re-enter-password'),
        });
      }
    });
  } catch (error) {
    console.error('Auth0 ACUL initialization failed:', error);
    const form = document.querySelector('[data-profile-form]') || document.querySelector('form');
    if (form) showError(form, 'Authentication is temporarily unavailable. Please try again.');
  }
}

start();
