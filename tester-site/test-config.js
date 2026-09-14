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
  const testUploads = new Map();

  const response = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });

  const requestUrl = resource => {
    const value = typeof resource === "string" ? resource : resource?.url;
    try { return new URL(value, location.href).pathname; }
    catch { return String(value || ""); }
  };

  const requestBody = options => {
    try { return JSON.parse(String(options?.body || "{}")); }
    catch { return {}; }
  };

  window.addEventListener("DOMContentLoaded", () => {
    for (const fieldName of ["termsAccepted", "earlyStart"]) {
      document.querySelector(`[name="${fieldName}"]`)?.closest("label")?.remove();
    }
    const privacyReminder = document.querySelector(".form-step[data-step='8'] .privacy-note");
    if (privacyReminder) {
      privacyReminder.innerHTML = "<strong>Tester privacy</strong><p>This copy does not send answers, recordings or selected documents to SABI. Everything remains in this browser and can be cleared using Saved-answer options.</p>";
    }
  });

  window.fetch = async (resource, options = {}) => {
    const path = requestUrl(resource);
    const input = requestBody(options);

    if (path === config.sessionEndpoint) {
      return response({ ok: true, token: "tester-browser-only", expiresInSeconds: 900 });
    }

    if (path === config.uploadEndpoint) {
      if (input.action === "ticket") {
        return response({ ok: true, receiverUrl: "/api/test-upload-receiver", token: "tester-browser-only" });
      }
      if (input.action === "status") {
        const upload = testUploads.get(input.uploadRequestId);
        return response({ ok: true, upload: upload || null });
      }
      if (input.action === "delete") {
        for (const [key, upload] of testUploads) if (upload.id === input.uploadId) testUploads.delete(key);
        return response({ ok: true, uploadId: input.uploadId });
      }
      return response({ ok: false, error: "Unknown test upload action." }, 400);
    }

    if (path === "/api/test-upload-receiver") {
      const file = input.file || {};
      testUploads.set(input.uploadRequestId, {
        id: `test-${input.uploadRequestId}`,
        field: file.field || "document",
        name: file.name || "test-file",
        size: Number(file.size || 1),
        type: file.type || "application/octet-stream",
        testOnly: true
      });
      return response({ ok: true });
    }

    if (path === config.endpoint) {
      const submissionId = String(input.submissionId || `test-${Date.now()}`);
      sessionStorage.setItem("sabiTesterLastSubmission", JSON.stringify({
        submissionId,
        completedAt: new Date().toISOString()
      }));
      await new Promise(resolve => setTimeout(resolve, 450));
      return response({ ok: true, submissionId, testOnly: true });
    }

    return nativeFetch(resource, options);
  };
})();
