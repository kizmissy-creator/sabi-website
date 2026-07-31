/** @OnlyCurrentDoc */

const CONTACT_CONFIG = {
  sheetName: 'Website Enquiries',
  maxBodyLength: 20000,
  minimumCompletionMs: 3000,
  maximumCompletionMs: 86400000,
  allowedContactMethods: ['', 'email', 'telephone', 'video-call', 'text-message']
};

function configureContactReceiver() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from its dedicated contact-form spreadsheet.');

  PropertiesService.getScriptProperties().setProperties({
    CONTACT_SUCCESS_URL: 'https://celadon-melomakarona-a77f9d.netlify.app/thank-you.html'
  });

  ensureContactSheet_(spreadsheet);
  return 'Contact receiver configured for this spreadsheet.';
}

function doPost(e) {
  try {
    const rawLength = e && e.postData && e.postData.contents ? e.postData.contents.length : 0;
    if (rawLength > CONTACT_CONFIG.maxBodyLength) throw new Error('Submission too large.');

    const submission = normaliseContactSubmission_(e);
    validateContactSubmission_(submission);

    if (submission.company) return contactSuccessResponse_();

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      enforceContactRateLimit_(submission.email);
      saveContactSubmission_(submission);
    } finally {
      lock.releaseLock();
    }

    return contactSuccessResponse_();
  } catch (error) {
    console.error('Contact submission rejected: ' + error.message);
    return contactErrorResponse_();
  }
}

function normaliseContactSubmission_(e) {
  let input = {};
  const contentType = String(e && e.postData && e.postData.type || '').toLowerCase();

  if (contentType.indexOf('application/json') !== -1) {
    input = JSON.parse(e.postData.contents || '{}');
  } else {
    input = e && e.parameter ? e.parameter : {};
  }

  return {
    submissionId: cleanText_(input.submissionId, 80),
    formStartedAt: cleanText_(input.formStartedAt, 20),
    company: cleanText_(input.company, 200),
    name: cleanText_(input.name, 120),
    email: cleanText_(input.email, 254).toLowerCase(),
    help: cleanText_(input.help, 3000),
    preferredContact: cleanText_(input.preferred_contact || input.preferredContact, 40),
    privacyAcknowledged: input.privacyAcknowledged === true || input.privacyAcknowledged === 'yes' || input.privacyAcknowledged === 'on'
  };
}

function validateContactSubmission_(submission) {
  if (!/^[a-f0-9-]{36}$/i.test(submission.submissionId)) throw new Error('Invalid submission identifier.');
  if (!submission.name) throw new Error('Name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) throw new Error('Valid email is required.');
  if (!submission.help) throw new Error('Message is required.');
  if (CONTACT_CONFIG.allowedContactMethods.indexOf(submission.preferredContact) === -1) throw new Error('Invalid contact preference.');
  if (!submission.privacyAcknowledged) throw new Error('Privacy acknowledgement is required.');

  const startedAt = Number(submission.formStartedAt);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < CONTACT_CONFIG.minimumCompletionMs || elapsed > CONTACT_CONFIG.maximumCompletionMs) {
    throw new Error('Invalid form timing.');
  }
}

function saveContactSubmission_(submission) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('This receiver must remain attached to its dedicated contact-form spreadsheet.');
  const sheet = ensureContactSheet_(spreadsheet);
  const existing = sheet.getRange('B:B').createTextFinder(submission.submissionId).matchEntireCell(true).findNext();
  if (existing) return;

  sheet.appendRow([
    new Date(),
    safeContactCell_(submission.submissionId),
    safeContactCell_(submission.name),
    safeContactCell_(submission.email),
    safeContactCell_(submission.preferredContact),
    safeContactCell_(submission.help),
    'New'
  ]);
}

function ensureContactSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONTACT_CONFIG.sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(CONTACT_CONFIG.sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['received_at', 'submission_id', 'name', 'email', 'preferred_contact', 'message', 'status']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function enforceContactRateLimit_(email) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email);
  const key = 'contact-rate-' + Utilities.base64EncodeWebSafe(digest).slice(0, 32);
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get(key) || 0);
  if (count >= 3) throw new Error('Rate limit exceeded.');
  cache.put(key, String(count + 1), 600);
}

function cleanText_(value, maximumLength) {
  return String(value == null ? '' : value).replace(/\u0000/g, '').trim().slice(0, maximumLength);
}

function safeContactCell_(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function contactSuccessResponse_() {
  const successUrl = PropertiesService.getScriptProperties().getProperty('CONTACT_SUCCESS_URL');
  const safeUrl = JSON.stringify(successUrl || 'https://celadon-melomakarona-a77f9d.netlify.app/thank-you.html').replace(/</g, '\\u003c');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><base target="_top"><title>Thank you</title><script>window.top.location.replace(' + safeUrl + ');</script><p>Your enquiry has been received. <a href=' + safeUrl + '>Continue to SABI</a>.</p>');
}

function contactErrorResponse_() {
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><title>Unable to send</title><p>Your enquiry could not be sent. Please return to the form and try again.</p>');
}
