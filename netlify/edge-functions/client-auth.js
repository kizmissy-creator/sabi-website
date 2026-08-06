const COOKIE_NAME = "sabi_client_access";
const SESSION_SECONDS = 12 * 60 * 60;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function loginPage(message = "") {
  const notice = message
    ? `<p class="error" role="alert">${escapeHtml(message)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
  <meta name="referrer" content="no-referrer">
  <title>Private client page | SABI</title>
  <style>
    :root { color-scheme: light; font-family: Manrope, Arial, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f5fdfd; color: #131d1d; }
    main { width: min(100%, 520px); background: #fff; border: 1px solid #d9e5e4; border-radius: 18px; padding: clamp(28px, 6vw, 52px); box-shadow: 0 18px 55px rgba(21,109,107,.12); }
    .mark { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 50%; background: #3d8583; color: #fff; font: 700 22px Georgia, serif; margin-bottom: 24px; }
    .eyebrow { margin: 0 0 10px; color: #156d6b; font-size: 12px; letter-spacing: .09em; font-weight: 800; }
    h1 { margin: 0 0 14px; font: 600 clamp(34px, 8vw, 48px)/1.05 Georgia, serif; color: #214f4e; }
    p { line-height: 1.65; }
    label { display: block; margin: 26px 0 8px; font-weight: 700; }
    input { width: 100%; min-height: 50px; padding: 12px 14px; border: 2px solid #aebfbd; border-radius: 9px; font: inherit; }
    input:focus { outline: 3px solid rgba(242,201,76,.55); border-color: #156d6b; }
    button { width: 100%; min-height: 50px; margin-top: 18px; border: 0; border-radius: 9px; background: #f2c94c; color: #174f4d; font: 800 16px Manrope, Arial, sans-serif; cursor: pointer; }
    button:hover { background: #ebc246; }
    .error { padding: 12px 14px; border-radius: 8px; background: #ffdad6; color: #7f1520; }
    .help { margin-top: 24px; color: #536361; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <div class="mark" aria-hidden="true">S</div>
    <p class="eyebrow">PRIVATE SABI CLIENT PAGE</p>
    <h1>Welcome, Bronagh.</h1>
    <p>Enter the access password Sam sent you to open your Career Partner onboarding page.</p>
    ${notice}
    <form method="post">
      <label for="password">Access password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
      <button type="submit">Open my onboarding</button>
    </form>
    <p class="help">The password is separate from your answers. Contact Sam if you cannot access the page.</p>
  </main>
</body>
</html>`;
}

function pageResponse(message = "", status = 401) {
  return new Response(loginPage(message), {
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
  const password = Netlify.env.get("BRONAGH_PAGE_PASSWORD");
  const secret = Netlify.env.get("BRONAGH_COOKIE_SECRET");

  if (!password || !secret) {
    return pageResponse("This private page has not been activated yet. Please contact Sam.", 503);
  }

  const expectedToken = await sha256(`${password}:${secret}`);
  const existingToken = context.cookies.get(COOKIE_NAME);

  if (existingToken === expectedToken) {
    return;
  }

  if (request.method === "POST") {
    const formData = await request.formData();
    const submittedPassword = String(formData.get("password") || "");

    if (submittedPassword === password) {
      context.cookies.set({
        name: COOKIE_NAME,
        value: expectedToken,
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: SESSION_SECONDS
      });

      return Response.redirect(new URL(request.url).origin + "/", 303);
    }

    return pageResponse("That password was not recognised. Check it and try again.", 401);
  }

  return pageResponse();
}
