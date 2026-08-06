window.SABI_ONBOARDING_CONFIG = {
  endpoint: "/api/onboarding-submit",
  sessionEndpoint: "/api/onboarding-session",
  confirmationUrl: "./confirmation.html",
  maxFileBytes: 8 * 1024 * 1024,
  maxTotalFileBytes: 15 * 1024 * 1024,
  acceptedExtensions: ["pdf", "doc", "docx", "txt"]
};

(() => {
  const nativeFetch = window.fetch.bind(window);
  const config = window.SABI_ONBOARDING_CONFIG;

  window.addEventListener("DOMContentLoaded", () => {
    const fileInputs = [...document.querySelectorAll('input[type="file"]')];
    const existingNotice = fileInputs.at(-1)?.closest("section")?.querySelector(".notice");
    if (existingNotice && !existingNotice.textContent.includes("15 MB")) {
      existingNotice.insertAdjacentText(
        "afterbegin",
        "The combined size of all selected files must be 15 MB or less. "
      );
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

    const totalFileBytes = (submission.files || []).reduce(
      (total, file) => total + Number(file.size || 0),
      0
    );
    if (totalFileBytes > config.maxTotalFileBytes) {
      throw new Error("The selected files are more than 15 MB in total. Remove one or send the additional document separately.");
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
