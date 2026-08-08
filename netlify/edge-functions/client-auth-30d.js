const COOKIE_NAME = "sabi_client_access";
const CLIENT_REFERENCE = "CL-2026-001";
const PREVIEW_HOST = "deploy-preview-2--celadon-melomakarona-a77f9d.netlify.app";
const PREVIEW_TOKEN = "8a110a28c4bf4032b74975e2a89d3b1f";
const PREVIEW_EXPIRES_AT = Date.parse("2026-08-10T00:00:00Z");

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return atob(padded);
}

function bytes(value) {
  return new TextEncoder().encode(value);
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, bytes(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function accessPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Career Partner onboarding | SABI</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fdfd;color:#131d1d;font:16px/1.65 Arial,sans-serif}main{width:min(100%,620px);background:#fff;border:1px solid #cbdad9;border-radius:20px;padding:clamp(28px,6vw,52px);box-shadow:0 18px 50px rgba(22,73,72,.1)}h1{color:#156d6b;font:600 clamp(36px,8vw,54px)/1.05 Georgia,serif;margin:.2rem 0 1rem}a{display:inline-block;margin-top:1rem;padding:.8rem 1rem;border-radius:10px;background:#f2c94c;color:#0e5553;font-weight:700;text-decoration:none}</style></head><body><main><p>SABI CAREER SUPPORT</p><h1>Your onboarding is private.</h1><p>This page opens after the Career Partner payment has been verified on this browser.</p><a href="/payment.html">Return to the Career Partner page</a></main></body></html>`;
}

function denied() {
  return new Response(accessPage(), {
    status: 401,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
      "referrer-policy": "no-referrer",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff"
    }
  });
}

export default async function clientAuth(request, context) {
  try {
    const url = new URL(request.url);
    const isWorkingPreview =
      url.hostname === PREVIEW_HOST &&
      (url.pathname === "/" || url.pathname === "/index.html") &&
      url.searchParams.get("preview_access") === PREVIEW_TOKEN &&
      Date.now() < PREVIEW_EXPIRES_AT;

    if (isWorkingPreview) return;

    const secret = Netlify.env.get("BRONAGH_ACCESS_SECRET");
    if (!secret) return denied();

    const token = context.cookies.get(COOKIE_NAME) || "";
    const parts = token.split(".");
    if (parts.length !== 2) return denied();

    let payload;
    try {
      payload = base64UrlDecode(parts[0]);
    } catch {
      return denied();
    }

    const signature = await hmac(secret, payload);
    if (!constantTimeEqual(signature, parts[1])) return denied();

    const [clientReference, sessionId, expiresText] = payload.split(".");
    const expires = Number(expiresText);
    if (clientReference !== CLIENT_REFERENCE || !sessionId.startsWith("cs_") || !Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) {
      return denied();
    }

    return;
  } catch {
    return denied();
  }
}
