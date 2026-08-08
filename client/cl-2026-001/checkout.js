(() => {
  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/4gMaEX0t36c9dKW8Ql7Zu00";
  const terms = document.getElementById("accept-terms");
  const earlyStart = document.getElementById("early-start");
  const button = document.getElementById("pay-button");
  const message = document.getElementById("checkout-message");

  if (!terms || !earlyStart || !button || !message) return;

  function refresh() {
    button.disabled = !terms.checked;
    button.classList.toggle("disabled-payment", button.disabled);
  }

  terms.addEventListener("change", refresh);
  refresh();

  button.addEventListener("click", () => {
    if (!terms.checked || button.disabled) return;

    button.disabled = true;
    button.classList.add("disabled-payment");
    button.textContent = "Opening secure payment…";
    message.textContent = "";
    message.classList.add("hidden");

    try {
      const checkoutUrl = new URL(STRIPE_PAYMENT_LINK);
      checkoutUrl.searchParams.set("client_reference_id", "CL-2026-001");
      checkoutUrl.searchParams.set("utm_source", "private_client_page");
      checkoutUrl.searchParams.set("utm_medium", "direct");
      checkoutUrl.searchParams.set("utm_campaign", "career_partner_bespoke");
      checkoutUrl.searchParams.set(
        "utm_content",
        earlyStart.checked ? "early_start_requested" : "standard_start"
      );

      location.assign(checkoutUrl.toString());
    } catch (error) {
      message.textContent = error.message || "Secure payment could not be opened. Please try again.";
      message.classList.remove("hidden");
      button.textContent = "Pay £135 securely";
      refresh();
    }
  });
})();

