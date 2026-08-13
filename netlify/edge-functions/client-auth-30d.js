const COOKIE_NAME = "sabi_client_access";
const CLIENT_REFERENCE = "CL-2026-001";
const PREVIEW_HOST = "deploy-preview-2--sabi-bronagh-onboarding.netlify.app";
const SESSION_SECONDS = 30 * 24 * 60 * 60;

function isPublicPaymentResource(path) {
  return path === "/payment-confirmation.html"
    || path === "/onboarding.css"
    || path.startsWith("/documents/")
    || path.startsWith("/images/");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return atob(padded);
}

function base64UrlEncode(value) {
  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
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

function accessPage(message = "") {
  const notice = message ? `<p class="notice" role="alert">${escapeHtml(message)}</p>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Career Partner onboarding | SABI</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f3fbfb;color:#172424;font:17px/1.6 Arial,sans-serif}main{width:min(100%,620px);background:#fff;border:1px solid #cbdad9;border-radius:20px;padding:clamp(28px,6vw,52px);box-shadow:0 18px 50px rgba(22,73,72,.1)}.eyebrow{margin:0;color:#126d6a;font-size:.82rem;font-weight:800;letter-spacing:.12em}h1{color:#156d6b;font:600 clamp(38px,8vw,56px)/1.05 Georgia,serif;margin:.35rem 0 1rem}label{display:block;margin:1.5rem 0 .45rem;color:#075956;font-weight:700}input{width:100%;min-height:52px;border:1px solid #789694;border-radius:10px;padding:.75rem 1rem;font:inherit}input:focus{outline:3px solid rgba(242,201,76,.5);outline-offset:2px;border-color:#156d6b}button{margin-top:1rem;border:0;border-radius:10px;background:#f2c94c;color:#0e5553;padding:.85rem 1.15rem;font:700 1rem Arial,sans-serif;cursor:pointer}.notice{border-left:4px solid #cf3c53;background:#fff2f4;padding:.7rem .9rem;color:#7f1730}.quiet{color:#506563;font-size:.94rem}a{color:#075956;font-weight:700}</style></head><body><main><p class="eyebrow">SABI CAREER SUPPORT</p><h1>Your onboarding is private.</h1><p>If you are opening the form on a different device or browser, enter the access password SABI sent you separately.</p>${notice}<form method="post" action="/"><label for="password">Access password</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Open my onboarding</button></form><p class="quiet">If you have not received the password yet, contact SABI. The browser used to make the payment should open automatically.</p><p><a href="/payment.html">Return to the Career Partner page</a></p></main></body></html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function denied(message = "", status = 401) {
  return new Response(accessPage(message), {
    status,
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
    if (isPublicPaymentResource(url.pathname)) return context.next();
    const previewToken = Netlify.env.get("BRONAGH_PREVIEW_TOKEN") || "";
    const previewExpiresAt = Date.parse(Netlify.env.get("BRONAGH_PREVIEW_EXPIRES_AT") || "");
    const isWorkingPreview =
      url.hostname === PREVIEW_HOST &&
      previewToken &&
      constantTimeEqual(url.searchParams.get("preview_access") || "", previewToken) &&
      Number.isFinite(previewExpiresAt) &&
      Date.now() < previewExpiresAt;

    const secret = Netlify.env.get("BRONAGH_ACCESS_SECRET") || "";
    if (!secret) return denied();

    if (isWorkingPreview) {
      const expires = Math.min(
        Math.floor(previewExpiresAt / 1000),
        Math.floor(Date.now() / 1000) + 24 * 60 * 60
      );
      const payload = `${CLIENT_REFERENCE}.cs_preview.${expires}`;
      const encodedPayload = base64UrlEncode(payload);
      const signature = await hmac(secret, payload);

      url.searchParams.delete("preview_access");
      const cookie = [
        `${COOKIE_NAME}=${encodedPayload}.${signature}`,
        "Path=/",
        `Expires=${new Date(expires * 1000).toUTCString()}`,
        "Secure",
        "HttpOnly",
        "SameSite=Strict"
      ].join("; ");
      return new Response(null, {
        status: 302,
        headers: {
          location: url.toString(),
          "set-cookie": cookie,
          "cache-control": "private, no-store, max-age=0",
          "referrer-policy": "no-referrer"
        }
      });
    }

    const token = context.cookies.get(COOKIE_NAME) || "";
    const parts = token.split(".");
    if (parts.length === 2) {
      try {
        const payload = base64UrlDecode(parts[0]);
        const signature = await hmac(secret, payload);
        const [clientReference, sessionId, expiresText] = payload.split(".");
        const expires = Number(expiresText);
        if (
          constantTimeEqual(signature, parts[1]) &&
          clientReference === CLIENT_REFERENCE &&
          sessionId.startsWith("cs_") &&
          Number.isFinite(expires) &&
          expires >= Math.floor(Date.now() / 1000)
        ) return context.next();
      } catch {
        // Continue to the password gate when the saved access cookie is invalid.
      }
    }

    const pagePassword = Netlify.env.get("BRONAGH_PAGE_PASSWORD") || "";
    if (!pagePassword) return denied("Password access has not been activated yet. Please contact SABI.", 503);
    if (request.method !== "POST") return denied();

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/x-www-form-urlencoded") && !contentType.includes("multipart/form-data")) {
      return denied("Please enter the access password using the form below.");
    }
    const form = await request.formData();
    const suppliedPassword = String(form.get("password") || "");
    if (!constantTimeEqual(suppliedPassword, pagePassword)) return denied("That password was not recognised. Please try again.");

    const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const payload = `${CLIENT_REFERENCE}.cs_password.${expires}`;
    const encodedPayload = base64UrlEncode(payload);
    const signature = await hmac(secret, payload);
    const cookie = [
      `${COOKIE_NAME}=${encodedPayload}.${signature}`,
      "Path=/",
      `Expires=${new Date(expires * 1000).toUTCString()}`,
      "Secure",
      "HttpOnly",
      "SameSite=Strict"
    ].join("; ");
    return new Response(null, {
      status: 303,
      headers: {
        location: "/",
        "set-cookie": cookie,
        "cache-control": "private, no-store, max-age=0",
        "referrer-policy": "no-referrer"
      }
    });
  } catch {
    return denied();
  }
}
