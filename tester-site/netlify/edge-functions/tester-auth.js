const COOKIE_NAME = "sabi_tester_access";
const CLIENT_REFERENCE = "TEST-CAREER-PARTNER";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

function encode(value) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value) {
  return atob(value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4));
}

function bytes(value) { return new TextEncoder().encode(value); }

function equal(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

async function sign(secret, value) {
  const key = await crypto.subtle.importKey("raw", bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, bytes(value));
  return encode(String.fromCharCode(...new Uint8Array(signature)));
}

function safePath(request) {
  const rawPath = new URL(request.url).pathname;
  let path;
  try { path = decodeURIComponent(rawPath); } catch { return "/"; }
  // Messaging apps can accidentally add an invisible character to a copied URL.
  // Remove those characters before sending the tester back to the requested page.
  path = path.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function isPublicTesterPage(path) {
  return path === "/payment.html"
    || path === "/payment-confirmation.html"
    || path === "/payment.css"
    || path === "/checkout.js"
    || path === "/tester.css"
    || path.startsWith("/images/");
}

function accessPage(message = "", action = "/") {
  const notice = message ? `<p class="notice" role="alert">${message}</p>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>SABI tester access</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f3fbfb;color:#172424;font:17px/1.6 Arial,sans-serif}main{width:min(100%,620px);background:#fff;border:1px solid #cbdad9;border-radius:20px;padding:clamp(28px,6vw,52px);box-shadow:0 18px 50px rgba(22,73,72,.1)}.mode{display:inline-block;background:#fff1b8;color:#543f00;padding:.35rem .6rem;border-radius:999px;font-weight:800;font-size:.8rem}.eyebrow{margin:1rem 0 0;color:#126d6a;font-size:.82rem;font-weight:800;letter-spacing:.12em}h1{color:#156d6b;font:600 clamp(38px,8vw,56px)/1.05 Georgia,serif;margin:.35rem 0 1rem}label{display:block;margin:1.5rem 0 .45rem;color:#075956;font-weight:700}input{width:100%;min-height:52px;border:1px solid #789694;border-radius:10px;padding:.75rem 1rem;font:inherit}input:focus{outline:3px solid rgba(242,201,76,.5);outline-offset:2px;border-color:#156d6b}button{margin-top:1rem;border:0;border-radius:10px;background:#f2c94c;color:#0e5553;padding:.85rem 1.15rem;font:700 1rem Arial,sans-serif;cursor:pointer}.notice{border-left:4px solid #cf3c53;background:#fff2f4;padding:.7rem .9rem;color:#7f1730}.quiet{color:#506563;font-size:.94rem}</style></head><body><main><span class="mode">TEST MODE</span><p class="eyebrow">SABI CAREER SUPPORT</p><h1>Tester access</h1><p>This copy uses Stripe Sandbox and does not create a real payment or client record.</p>${notice}<form method="post" action="${action}"><label for="password">Tester password</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Open the tester page</button></form><p class="quiet">Answers remain on this browser only. Do not enter real confidential information.</p></main></body></html>`;
}

function denied(message = "", status = 401, action = "/") {
  return new Response(accessPage(message, action), { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow, noarchive", "x-frame-options": "DENY" } });
}

export default async function testerAuth(request, context) {
  try {
    const rawPath = new URL(request.url).pathname;
    const returnPath = safePath(request);
    if (rawPath !== returnPath) {
      const url = new URL(request.url);
      url.pathname = returnPath;
      return Response.redirect(url.toString(), 302);
    }
    if (isPublicTesterPage(returnPath)) return context.next();
    const secret = Netlify.env.get("TESTER_ACCESS_SECRET") || "";
    const password = Netlify.env.get("TESTER_PAGE_PASSWORD") || "";
    if (!secret || !password) return denied("Tester access has not been configured yet.", 503, returnPath);

    const token = context.cookies.get(COOKIE_NAME) || "";
    const [payloadPart, signature] = token.split(".");
    if (payloadPart && signature) {
      const payload = decode(payloadPart);
      const [reference, session, expiresText] = payload.split(".");
      if (reference === CLIENT_REFERENCE && session.startsWith("test_") && Number(expiresText) >= Math.floor(Date.now() / 1000) && equal(await sign(secret, payload), signature)) return context.next();
    }

    if (request.method !== "POST") return denied("", 401, returnPath);
    const form = await request.formData();
    if (!equal(String(form.get("password") || ""), password)) return denied("That tester password was not recognised.", 401, returnPath);

    const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const payload = `${CLIENT_REFERENCE}.test_password.${expires}`;
    const cookie = `${COOKIE_NAME}=${encode(payload)}.${await sign(secret, payload)}; Path=/; Expires=${new Date(expires * 1000).toUTCString()}; Secure; HttpOnly; SameSite=Strict`;
    return new Response(null, { status: 303, headers: { location: returnPath, "set-cookie": cookie, "cache-control": "private, no-store" } });
  } catch {
    return denied();
  }
}
