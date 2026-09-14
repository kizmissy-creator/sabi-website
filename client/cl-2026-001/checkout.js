(() => {
  const CLIENT_REFERENCE = "CL-2026-001";
  const SERVICE_CODE = "career_partner_bespoke";
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

  button.addEventListener("click", async () => {
    if (!terms.checked || button.disabled) return;

    button.disabled = true;
    button.classList.add("disabled-payment");
    button.textContent = "Opening secure payment…";
    message.textContent = "";
    message.classList.add("hidden");

    try {
      const response = await fetch("/api/create-career-partner-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientReference: CLIENT_REFERENCE,
          serviceCode: SERVICE_CODE,
          termsAccepted: true,
          earlyStart: earlyStart.checked
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Secure payment could not be opened. Please try again.");
      location.assign(result.checkoutUrl);
    } catch (error) {
      message.textContent = error.message || "Secure payment could not be opened. Please try again.";
      message.classList.remove("hidden");
      button.textContent = "Pay £135 securely";
      refresh();
    }
  });
})();

