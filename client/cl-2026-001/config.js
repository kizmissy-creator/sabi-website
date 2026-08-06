window.SABI_ONBOARDING_CONFIG = {
  endpoint: "/api/onboarding-submit",
  sessionEndpoint: "/api/onboarding-session",
  confirmationUrl: "./confirmation.html",
  maxFileBytes: 8 * 1024 * 1024,
  acceptedExtensions: ["pdf", "doc", "docx", "txt"]
};

(() => {
  const nativeFetch = window.fetch.bind(window);
  const config = window.SABI_ONBOARDING_CONFIG;

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
    if (!sessionResponse.ok || !session.ok || !session.endpoint || !session.token) {
      throw new Error(session.error || "Your secure access needs to be renewed before sending.");
    }

    submission.submissionToken = session.token;

    return nativeFetch(session.endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(submission)
    });
  };
})();
