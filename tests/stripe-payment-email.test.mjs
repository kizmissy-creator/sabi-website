import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import stripePaymentEmail from "../netlify/functions/stripe-payment-email.mjs";

const LIVE_SECRET = "whsec_live_test_value";
const TEST_SECRET = "whsec_sandbox_test_value";

function signedRequest(event, secret) {
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return new Request("https://bronagh.sabigroup.co.uk/api/stripe-payment-email", {
    method: "POST",
    headers: { "stripe-signature": `t=${timestamp},v1=${signature}` },
    body
  });
}

function checkoutEvent(overrides = {}) {
  return {
    id: "evt_test_bronagh_email",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_bronagh_email",
        livemode: false,
        payment_status: "paid",
        amount_total: 13500,
        currency: "gbp",
        client_reference_id: "CL-2026-001",
        payment_link: "plink_1U2vSwFtDRl3MPZmHMvYptrp",
        customer_details: { email: "info@sabigroup.co.uk", name: "SABI test" },
        ...overrides
      }
    }
  };
}

function configureEnvironment() {
  process.env.STRIPE_PAYMENT_EMAIL_WEBHOOK_SECRET = LIVE_SECRET;
  process.env.STRIPE_PAYMENT_EMAIL_TEST_WEBHOOK_SECRET = TEST_SECRET;
  process.env.BRONAGH_APPS_SCRIPT_ENDPOINT = "https://script.google.test/exec";
  process.env.BRONAGH_PAYMENT_EMAIL_SECRET = "delivery-secret";
}

test("accepts the configured sandbox link and sends only to the SABI test address", async () => {
  configureEnvironment();
  let delivered;
  global.fetch = async (_url, options) => {
    delivered = JSON.parse(options.body);
    return Response.json({ ok: true });
  };

  const response = await stripePaymentEmail(signedRequest(checkoutEvent(), TEST_SECRET));
  assert.equal(response.status, 200);
  assert.equal(delivered.recipient, "info@sabigroup.co.uk");
  assert.equal(delivered.testMode, true);
});

test("continues to accept the configured live Career Partner link", async () => {
  configureEnvironment();
  let delivered;
  global.fetch = async (_url, options) => {
    delivered = JSON.parse(options.body);
    return Response.json({ ok: true });
  };
  const event = checkoutEvent({
    id: "cs_live_bronagh_email",
    livemode: true,
    payment_link: "plink_1U1JeFFtDRl3MPZmzTTHjBWx",
    customer_details: { email: "bronagh@example.com", name: "Bronagh" }
  });

  const response = await stripePaymentEmail(signedRequest(event, LIVE_SECRET));
  assert.equal(response.status, 200);
  assert.equal(delivered.recipient, "bronagh@example.com");
  assert.equal(delivered.testMode, false);
});

test("ignores sandbox events without the client reference", async () => {
  configureEnvironment();
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; return Response.json({ ok: true }); };

  const response = await stripePaymentEmail(signedRequest(checkoutEvent({ client_reference_id: null }), TEST_SECRET));
  assert.deepEqual(await response.json(), { ok: true, ignored: true });
  assert.equal(fetchCalled, false);
});

test("ignores sandbox events addressed to anyone other than SABI", async () => {
  configureEnvironment();
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; return Response.json({ ok: true }); };
  const event = checkoutEvent({ customer_details: { email: "client@example.com", name: "Client" } });

  const response = await stripePaymentEmail(signedRequest(event, TEST_SECRET));
  assert.deepEqual(await response.json(), { ok: true, ignored: true });
  assert.equal(fetchCalled, false);
});

test("rejects an invalid webhook signature", async () => {
  configureEnvironment();
  const response = await stripePaymentEmail(signedRequest(checkoutEvent(), "wrong-secret"));
  assert.equal(response.status, 400);
});
