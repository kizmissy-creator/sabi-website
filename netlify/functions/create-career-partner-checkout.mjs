const CLIENT_REFERENCE = "CL-2026-001";
const SERVICE_CODE = "career_partner_bespoke";
const TERMS_VERSION = "2026-08-07";
const PRIVACY_VERSION = "2026-08-07";
const AMOUNT_PENCE = 13500;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff"
    }
  });
}

function stripeBody(origin, input) {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/payment.html?cancelled=1`);
  body.set("line_items[0][price_data][currency]", "gbp");
  body.set("line_items[0][price_data][unit_amount]", String(AMOUNT_PENCE));
  body.set("line_items[0][price_data][product_data][name]", "SABI Bespoke Career Partner Package");
  body.set("line_items[0][quantity]", "1");
  body.set("metadata[client_reference]", CLIENT_REFERENCE);
  body.set("metadata[service_code]", SERVICE_CODE);
  body.set("metadata[terms_version]", TERMS_VERSION);
  body.set("metadata[privacy_version]", PRIVACY_VERSION);
  body.set("metadata[terms_accepted]", "yes");
  body.set("metadata[privacy_policy_provided]", "yes");
  body.set("metadata[early_start]", input.earlyStart ? "requested" : "not_requested");
  body.set("metadata[accepted_at]", new Date().toISOString());
  return body;
}

export default async function createCareerPartnerCheckout(request) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return json({ ok: false, error: "Secure payment is not active yet." }, 503);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid checkout request." }, 400);
  }

  if (input.clientReference !== CLIENT_REFERENCE || input.serviceCode !== SERVICE_CODE) {
    return json({ ok: false, error: "Invalid client checkout." }, 400);
  }
  if (input.termsAccepted !== true) {
    return json({ ok: false, error: "Please accept the Terms and Conditions before continuing." }, 400);
  }
  if (typeof input.earlyStart !== "boolean") {
    return json({ ok: false, error: "Invalid early-start choice." }, 400);
  }

  const origin = new URL(request.url).origin;
  let stripeResponse;
  try {
    stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: stripeBody(origin, input)
    });
  } catch {
    return json({ ok: false, error: "Stripe could not be reached. Please try again." }, 502);
  }

  const session = await stripeResponse.json().catch(() => ({}));
  if (!stripeResponse.ok || !session.id || !session.url) {
    console.error("Stripe checkout creation failed", session?.error?.message || session);
    return json({ ok: false, error: "Secure payment could not be opened. Please try again." }, 502);
  }

  return json({ ok: true, checkoutUrl: session.url });
}

export const config = {
  path: "/api/create-career-partner-checkout"
};
