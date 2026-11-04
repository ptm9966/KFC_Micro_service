function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function getManagementToken(env) {
  const response = await fetch(`https://${env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.AUTH0_MGMT_CLIENT_ID,
      client_secret: env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) throw new Error(`Auth0 token request failed: ${response.status}`);
  const data = await response.json();
  return data.access_token;
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid request body' }, 400);
  }

  const email = String(body?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return jsonResponse({ message: 'Valid email is required' }, 400);
  }

  if (!env.AUTH0_DOMAIN || !env.AUTH0_MGMT_CLIENT_ID || !env.AUTH0_MGMT_CLIENT_SECRET) {
    return jsonResponse({ message: 'Auth0 Worker is not configured' }, 503);
  }

  try {
    const managementToken = await getManagementToken(env);
    const url = new URL(`https://${env.AUTH0_DOMAIN}/api/v2/users-by-email`);
    url.searchParams.set('email', email);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${managementToken}` },
    });

    if (!response.ok) throw new Error(`Auth0 user lookup failed: ${response.status}`);
    const users = await response.json();
    return jsonResponse({ exists: Array.isArray(users) && users.length > 0 });
  } catch (error) {
    console.error('Auth0 Worker email check failed:', error);
    return jsonResponse({ message: 'Unable to check Auth0 account' }, 503);
  }
}
