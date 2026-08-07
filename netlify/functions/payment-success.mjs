import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "sabi_client_access";
const CLIENT_REFERENCE = "CL-2026-001";
const SERVICE_CODE = "career_partner_bespoke";
const AMOUNT_PENCE = 13500;
const ACCESS_SECONDS = 30 * 24 * 60 * 60;

function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "x-frame-options": "DENY",
      ...headers
    }
  });
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function signAccess(secret, sessionId) {
  const expires = Math.floor(Date.now() / 1000) + ACCESS_SECONDS;
  const payload = `${CLIENT_REFERENCE}.${sessionId}.${expires}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

function page(title, message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${title} | SABI</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fdfd;color:#131d1d;font:16px/1.65 Arial,sans-serif}main{width:min(100%,650px);background:#fff;border:1px solid #cbdad9;border-radius:20px;padding:clamp(28px,6vw,52px);box-shadow:0 18px 50px rgba(22,73,72,.1)}h1{color:#156d6b;font:600 clamp(36px,8vw,54px)/1.05 Georgia,serif;margin:.2rem 0 1rem}a{display:inline-block;margin-top:1rem;padding:.8rem 1rem;border-radius:10px;background:#f2c94c;color:#0e5553;font-weight:700;text-decoration:none}</style></head><body><main><p>SABI CAREER SUPPORT</p><h1>${title}</h1><p>${message}</p><a href="/">Open my onboarding</a></main></body></html>`;
}

export default async function paymentSuccess(request) {
  if (request.method !== "GET") return html(page("Payment check", "This page only accepts a completed checkout return."), 405);

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const accessSecret = process.env.BRONAGH_ACCESS_SECRET;
  if (!stripeSecret || !accessSecret) {
    return html(page("Not activated yet", "The secure payment verification route has not been fully activated."), 503);
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id") || "";
  if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) {
    return html(page("Payment could not be verified", "The checkout reference is missing or invalid. Please contact SABI."), 400);
  }

  let stripeResponse;
  try {
    stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${stripeSecret}` }
    });
  } catch {
    return html(page("Payment check unavailable", "Stripe could not be reached. Your payment record has not been changed. Please try again shortly."), 502);
  }

  const session = await stripeResponse.json().catch(() => ({}));
  if (!stripeResponse.ok) {
    console.error("Stripe session verification failed", session?.error?.message || session);
    return html(page("Payment could not be verified", "Please contact SABI with your Stripe receipt."), 502);
  }

  const metadata = session.metadata || {};
  const valid =
    session.payment_status === "paid" &&
    Number(session.amount_total) === AMOUNT_PENCE &&
    String(session.currency || "").toLowerCase() === "gbp" &&
    safeEqual(metadata.client_reference, CLIENT_REFERENCE) &&
    safeEqual(metadata.service_code, SERVICE_CODE) &&
    metadata.terms_accepted === "yes" &&
    metadata.privacy_policy_provided === "yes";

  if (!valid) {
    console.error("Rejected checkout session", { id: session.id, payment_status: session.payment_status, amount_total: session.amount_total, currency: session.currency, metadata });
    return html(page("Payment could not be matched", "The payment did not match the expected Career Partner purchase. Please contact SABI before continuing."), 403);
  }

  const token = signAccess(accessSecret, session.id);
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${ACCESS_SECONDS}; HttpOnly; Secure; SameSite=Lax`;

  return html(
    page("Payment confirmed", "Thank you. Your £135 Career Partner payment has been verified and this browser now has access to your onboarding form for 30 days."),
    200,
    { "set-cookie": cookie }
  );
}

export const config = {
  path: "/payment-success"
};
