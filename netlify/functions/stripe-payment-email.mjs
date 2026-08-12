import { createHmac, timingSafeEqual } from "node:crypto";

const CLIENT_REFERENCE = "CL-2026-001";
const PAYMENT_LINK_ID = "plink_1U1JeFFtDRl3MPZmzTTHjBWx";
const AMOUNT_PENCE = 13500;
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function validStripeSignature(header, payload, secret) {
  let timestamp;
  const signatures = [];
  for (const part of String(header || "").split(",")) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;
    if (key.trim() === "t") timestamp = Number(value.trim());
    if (key.trim() === "v1") signatures.push(value.trim());
  }
  if (!Number.isFinite(timestamp) || !signatures.length || Math.abs(Date.now() / 1000 - timestamp) > MAX_WEBHOOK_AGE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some((signature) => safeEqual(expected, signature));
}

function signDelivery(secret, payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function checkoutIsEligible(session) {
  return session?.payment_status === "paid"
    && Number(session?.amount_total) === AMOUNT_PENCE
    && String(session?.currency || "").toLowerCase() === "gbp"
    && session?.client_reference_id === CLIENT_REFERENCE
    && session?.payment_link === PAYMENT_LINK_ID;
}

export default async function stripePaymentEmail(request) {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const stripeWebhookSecret = process.env.STRIPE_PAYMENT_EMAIL_WEBHOOK_SECRET;
  const appScriptEndpoint = process.env.BRONAGH_APPS_SCRIPT_ENDPOINT;
  const deliverySecret = process.env.BRONAGH_PAYMENT_EMAIL_SECRET;
  if (!stripeWebhookSecret || !appScriptEndpoint || !deliverySecret) {
    console.error("Payment confirmation email is not configured.");
    return json({ ok: false }, 503);
  }

  const rawBody = await request.text();
  if (!validStripeSignature(request.headers.get("stripe-signature"), rawBody, stripeWebhookSecret)) return json({ ok: false }, 400);

  let event;
  try { event = JSON.parse(rawBody); } catch { return json({ ok: false }, 400); }
  if (event?.type !== "checkout.session.completed") return json({ ok: true, ignored: true });

  const session = event?.data?.object;
  if (!checkoutIsEligible(session)) return json({ ok: true, ignored: true });
  const recipient = String(session?.customer_details?.email || session?.customer_email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return json({ ok: false }, 422);

  const origin = new URL(request.url).origin;
  const payload = {
    action: "payment_confirmation",
    deliveryId: String(event.id || session.id),
    checkoutSessionId: String(session.id),
    recipient,
    firstName: String(session?.customer_details?.name || "").trim().split(/\s+/)[0] || "there",
    amountPence: AMOUNT_PENCE,
    earlyStart: false,
    onboardingUrl: `${origin}/`,
    termsUrl: `${origin}/documents/terms-and-conditions.html`,
    privacyUrl: `${origin}/documents/privacy-policy.html`,
    cancellationUrl: `${origin}/documents/cancellation-form.html`,
    sentAt: new Date().toISOString()
  };

  try {
    const response = await fetch(appScriptEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, deliveryToken: signDelivery(deliverySecret, payload) })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true) throw new Error(`Google receiver did not confirm delivery (${response.status})`);
  } catch (error) {
    console.error("Payment confirmation email was not delivered", error);
    return json({ ok: false }, 502);
  }
  return json({ ok: true });
}

export const config = { path: "/api/stripe-payment-email" };

