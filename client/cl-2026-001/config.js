window.SABI_ONBOARDING_CONFIG = {
  endpoint: "/api/onboarding-submit",
  sessionEndpoint: "/api/onboarding-session",
  uploadEndpoint: "/api/onboarding-upload",
  confirmationUrl: "./confirmation.html",
  maxFileBytes: 12 * 1024 * 1024,
  acceptedExtensions: ["pdf", "doc", "docx", "txt", "webm", "m4a", "ogg"]
};

(() => {
  const nativeFetch = window.fetch.bind(window);
  const config = window.SABI_ONBOARDING_CONFIG;

  window.addEventListener("DOMContentLoaded", () => {
    for (const fieldName of ["termsAccepted", "earlyStart"]) {
      const field = document.querySelector(`[name="${fieldName}"]`);
      field?.closest("label")?.remove();
    }

    const privacyReminder = document.querySelector(".form-step[data-step='8'] .privacy-note");
    if (privacyReminder) {
      privacyReminder.innerHTML = "<strong>Privacy reminder</strong><p>Your Terms and Conditions, Privacy Policy and any early-start request were dealt with at checkout. This final step is only for checking and sending your onboarding information.</p>";
    }

  });

  window.fetch = async (resource, options = {}) => {
    const requestedUrl = typeof resource === "string" ? resource : resource?.url;
    if (requestedUrl !== config.endpoint) {
      return nativeFetch(resource, options);
    }

    let submission;
    try {
      submission = JSON.parse(String(options.body || "{}"));
    } catch {
      throw new Error("The form could not prepare the secure submission.");
    }

    const sessionResponse = await nativeFetch(config.sessionEndpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: submission.submissionId,
        clientReference: submission.clientReference,
        serviceCode: submission.serviceCode
      })
    });

    const session = await sessionResponse.json().catch(() => ({}));
    if (!sessionResponse.ok || !session.ok || !session.token) {
      throw new Error(session.error || "Your secure access needs to be renewed before sending.");
    }

    submission.submissionToken = session.token;

    return nativeFetch(config.endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission)
    });
  };
})();
