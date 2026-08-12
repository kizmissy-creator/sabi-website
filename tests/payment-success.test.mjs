import assert from "node:assert/strict";
import test from "node:test";
import paymentSuccess from "../netlify/functions/payment-success.mjs";

const livePaymentLink = "plink_1U1JeFFtDRl3MPZmzTTHjBWx";

function configureEnvironment() {
  process.env.STRIPE_SECRET_KEY = "rk_test_only";
  process.env.BRONAGH_ACCESS_SECRET = "test-access-secret";
}

function completedSession(clientReference) {
  return {
    id: "cs_live_bronagh_success",
    payment_status: "paid",
    amount_total: 13500,
    currency: "gbp",
    client_reference_id: clientReference,
    payment_link: livePaymentLink
  };
}

for (const clientReference of [
  "CL-2026-001-standard-start",
  "CL-2026-001-early-start"
]) {
  test(`accepts the paid ${clientReference} Checkout Session`, async () => {
    configureEnvironment();
    global.fetch = async () => Response.json(completedSession(clientReference));

    const response = await paymentSuccess(new Request(
      "https://bronagh.sabigroup.co.uk/payment-success?session_id=cs_live_bronagh_success"
    ));

    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "https://bronagh.sabigroup.co.uk/payment-confirmation.html");
    assert.match(response.headers.get("set-cookie"), /^sabi_client_access=/);
  });
}

test("rejects an unclassified client reference", async () => {
  configureEnvironment();
  global.fetch = async () => Response.json(completedSession("CL-2026-001"));

  const response = await paymentSuccess(new Request(
    "https://bronagh.sabigroup.co.uk/payment-success?session_id=cs_live_bronagh_success"
  ));

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("set-cookie"), null);
});
