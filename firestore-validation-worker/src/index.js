const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";

let cachedAccessToken;
let cachedAccessTokenExpiresAt = 0;
let signingKeyPromise;

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ status: "ok", service: "firestore-validation-worker" }, 200, corsHeaders);
      }

      if (request.method === "POST" && url.pathname === "/validate") {
        return await validateUser(request, env, corsHeaders);
      }

      if (request.method === "POST" && url.pathname === "/sync-user") {
        return await syncUser(request, env, corsHeaders);
      }

      return json({ message: "Not found" }, 404, corsHeaders);
    } catch (error) {
      console.error("Firestore validation failed:", error);
      return json({ message: "Unable to validate user" }, 503, corsHeaders);
    }
  },
};

async function validateUser(request, env, corsHeaders) {
  const body = await readJson(request);
  const userId = cleanString(body.userId);
  const email = cleanString(body.email)?.toLowerCase();

  if (!userId && !email) {
    return json({ message: "userId or email is required" }, 400, corsHeaders);
  }

  const document = userId
    ? await getUserById(env, userId)
    : await getUserByEmail(env, email);

  if (!document) {
    return json({ valid: false, user: null }, 200, corsHeaders);
  }

  return json(
    {
      valid: true,
      user: {
        id: document.name.split("/").pop(),
        ...documentFields(document.fields),
      },
    },
    200,
    corsHeaders,
  );
}

async function syncUser(request, env, corsHeaders) {
  if (!env.FIRESTORE_SYNC_SECRET || request.headers.get("X-Firestore-Sync-Secret") !== env.FIRESTORE_SYNC_SECRET) {
    return json({ message: "Unauthorized" }, 401, corsHeaders);
  }

  const body = await readJson(request);
  const auth0Id = cleanString(body.auth0Id);
  const email = cleanString(body.email)?.toLowerCase();
  const name = cleanString(body.name);
  const firstName = cleanString(body.firstName);
  const lastName = cleanString(body.lastName);
  const mobile = cleanString(body.mobile);
  const username = cleanString(body.username);

  if (!auth0Id || !email) {
    return json({ message: "auth0Id and email are required" }, 400, corsHeaders);
  }

  const collection = env.FIRESTORE_USERS_COLLECTION || "users";
  const documentId = encodeURIComponent(auth0Id.replaceAll("/", "_"));
  const path = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${documentId}`;
  const response = await firestoreRequest(env, `https://firestore.googleapis.com/v1/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        auth0Id: { stringValue: auth0Id },
        email: { stringValue: email },
        ...(name ? { name: { stringValue: name } } : {}),
        ...(firstName ? { firstName: { stringValue: firstName } } : {}),
        ...(lastName ? { lastName: { stringValue: lastName } } : {}),
        ...(mobile ? { mobile: { stringValue: mobile } } : {}),
        ...(username ? { username: { stringValue: username } } : {}),
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });

  if (!response.ok) throw new Error(`Firestore user sync failed: ${response.status}`);
  return json({ synced: true, id: auth0Id.replaceAll("/", "_") }, 200, corsHeaders);
}

async function getUserById(env, userId) {
  const path = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${env.FIRESTORE_USERS_COLLECTION || "users"}/${encodeURIComponent(userId)}`;
  const response = await firestoreRequest(env, `https://firestore.googleapis.com/v1/${path}`);

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore document lookup failed: ${response.status}`);
  return response.json();
}

async function getUserByEmail(env, email) {
  const projectPath = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  const response = await firestoreRequest(
    env,
    `https://firestore.googleapis.com/v1/${projectPath}:runQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: env.FIRESTORE_USERS_COLLECTION || "users" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "email" },
              op: "EQUAL",
              value: { stringValue: email },
            },
          },
          limit: 1,
        },
      }),
    },
  );

  if (!response.ok) throw new Error(`Firestore email lookup failed: ${response.status}`);
  const results = await response.json();
  return results.find((result) => result.document)?.document || null;
}

async function firestoreRequest(env, url, options = {}) {
  const accessToken = await getGoogleAccessToken(env);
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(url, { ...options, headers });
}

async function getGoogleAccessToken(env) {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = await signJwt(
    {
      alg: "RS256",
      typ: "JWT",
    },
    {
      iss: env.FIREBASE_CLIENT_EMAIL,
      scope: FIRESTORE_SCOPE,
      aud: GOOGLE_OAUTH_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    env.FIREBASE_PRIVATE_KEY,
  );

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) throw new Error(`Google token request failed: ${response.status}`);
  const token = await response.json();
  cachedAccessToken = token.access_token;
  cachedAccessTokenExpiresAt = Date.now() + Number(token.expires_in) * 1000;
  return cachedAccessToken;
}

async function signJwt(header, payload, privateKeyPem) {
  if (!signingKeyPromise) {
    signingKeyPromise = crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(privateKeyPem),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    await signingKeyPromise,
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${base64Url(new Uint8Array(signature))}`;
}

function documentFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValue(value)]));
}

function firestoreValue(value) {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(firestoreValue);
  if (value.mapValue) return documentFields(value.mapValue.fields);
  return undefined;
}

async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

function getCorsHeaders(request, env) {
  const configuredOrigin = env.CORS_ORIGIN || "*";
  const requestOrigin = request.headers.get("Origin");
  const origin = configuredOrigin === "*" ? "*" : requestOrigin === configuredOrigin ? configuredOrigin : "null";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

function pemToArrayBuffer(pem) {
  const normalizedPem = pem.replace(/\\n/g, "\n");
  const base64 = normalizedPem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
}

function base64Url(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
