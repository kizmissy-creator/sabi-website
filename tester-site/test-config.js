window.SABI_ONBOARDING_CONFIG = {
  endpoint: "/api/test-onboarding-submit",
  sessionEndpoint: "/api/test-onboarding-session",
  uploadEndpoint: "/api/test-onboarding-upload",
  confirmationUrl: "./confirmation.html",
  maxFileBytes: 12 * 1024 * 1024,
  acceptedExtensions: ["pdf", "doc", "docx", "txt", "webm", "m4a", "ogg"],
  testMode: true
};

window.addEventListener("DOMContentLoaded", () => {
  for (const fieldName of ["termsAccepted", "earlyStart"]) {
    document.querySelector(`[name="${fieldName}"]`)?.closest("label")?.remove();
  }
  const privacyReminder = document.querySelector(".form-step[data-step='8'] .privacy-note");
  if (privacyReminder) {
    privacyReminder.innerHTML = "<strong>Tester privacy</strong><p>Use fictional answers and harmless sample files only. When you send the form, they are stored in SABI's separate restricted tester folder so the complete process can be checked.</p>";
  }
});
