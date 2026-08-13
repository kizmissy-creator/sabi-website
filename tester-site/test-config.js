window.SABI_ONBOARDING_CONFIG = {
  endpoint: "/api/test-onboarding-submit",
  sessionEndpoint: "/api/test-onboarding-session",
  uploadEndpoint: "/api/test-onboarding-upload",
  confirmationUrl: "./confirmation.html",
  maxFileBytes: 12 * 1024 * 1024,
  acceptedExtensions: ["pdf", "doc", "docx", "txt", "webm", "m4a", "ogg"],
  testMode: true
};

(() => {
  const nativeFetch = window.fetch.bind(window);
  const config = window.SABI_ONBOARDING_CONFIG;

  window.fetch = async (resource, options = {}) => {
    const requestedUrl = typeof resource === "string" ? resource : resource?.url;
    if (requestedUrl !== config.endpoint) return nativeFetch(resource, options);

    let submission;
    try {
      submission = JSON.parse(String(options.body || "{}"));
    } catch {
      throw new Error("The tester form could not prepare the secure submission.");
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
      throw new Error(session.error || "Tester access needs to be renewed before sending.");
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

window.addEventListener("DOMContentLoaded", () => {
  for (const fieldName of ["termsAccepted", "earlyStart"]) {
    document.querySelector(`[name="${fieldName}"]`)?.closest("label")?.remove();
  }
  const privacyReminder = document.querySelector(".form-step[data-step='8'] .privacy-note");
  if (privacyReminder) {
    privacyReminder.innerHTML = "<strong>Tester privacy</strong><p>Use fictional answers and harmless sample files only. When you send the form, they are stored in SABI's separate restricted tester folder so the complete process can be checked.</p>";
  }
});
