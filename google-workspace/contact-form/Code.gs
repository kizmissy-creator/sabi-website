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
    CONTACT_ALLOWED_ORIGINS: 'https://celadon-melomakarona-a77f9d.netlify.app'
  });

  ensureContactSheet_(spreadsheet);
  return 'Contact receiver configured for this spreadsheet.';
}

function doPost(e) {
  let submission = null;
  let writing = false;
  try {
    const rawLength = e && e.postData && e.postData.contents ? e.postData.contents.length : 0;
    if (rawLength > CONTACT_CONFIG.maxBodyLength) throw new Error('Submission too large.');
    submission = normaliseContactSubmission_(e);
    validateContactSubmission_(submission);
    if (submission.company) throw new Error('Submission rejected.');
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      writing = true;
      saveContactSubmission_(submission);
    } finally {
      lock.releaseLock();
    }
    return contactResultResponse_(submission, 'accepted');
  } catch (error) {
    // No raw exception text or submitted information in application logs.
    console.error('Contact submission not confirmed.');
    return contactResultResponse_(submission, writing ? 'unconfirmed' : 'rejected');
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
    attemptId: cleanText_(input.attemptId, 80),
    parentOrigin: cleanText_(input.parentOrigin, 300),
    serviceArea: cleanText_(input.serviceArea, 20),
    serviceInterest: cleanText_(input.serviceInterest, 100),
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
  if (!/^[a-f0-9-]{36}$/i.test(submission.attemptId)) throw new Error('Invalid attempt identifier.');
  if (!isAllowedContactOrigin_(submission.parentOrigin)) throw new Error('Origin is not approved.');
  if (['unsure', 'career', 'admin', 'writing'].indexOf(submission.serviceArea) === -1) throw new Error('Invalid service area.');
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

  enforceContactRateLimit_(submission.email);
  sheet.appendRow([
    new Date(),
    safeContactCell_(submission.submissionId),
    safeContactCell_(submission.name),
    safeContactCell_(submission.email),
    safeContactCell_(submission.preferredContact),
    safeContactCell_('[' + submission.serviceArea + (submission.serviceInterest ? ': ' + submission.serviceInterest : '') + '] ' + submission.help),
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

function isAllowedContactOrigin_(origin) {
  if (!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?$/i.test(origin || '')) return false;
  const configured = PropertiesService.getScriptProperties().getProperty('CONTACT_ALLOWED_ORIGINS') || '';
  return configured.split(',').map(value => value.trim()).indexOf(origin) !== -1;
}

function contactResultResponse_(submission, result) {
  // Only a configured exact parent origin may receive the acknowledgement.
  // This allowlist is not caller authentication or a substitute for anti-spam.
  if (!submission || !isAllowedContactOrigin_(submission.parentOrigin)) {
    return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Unable to confirm</title></head><body><p>Your enquiry could not be confirmed. Return to the form and try again.</p></body></html>');
  }
  const payload = JSON.stringify({
    type: 'sabi-enquiry-result', version: 1,
    submissionId: submission.submissionId, attemptId: submission.attemptId,
    result: result
  }).replace(/</g, '\\u003c');
  const target = JSON.stringify(submission.parentOrigin).replace(/</g, '\\u003c');
  const text = result === 'accepted' ? 'Your enquiry has been received.' : 'Your enquiry could not be confirmed. Return to the form and try again.';
  // A small, non-interactive response only. Apps Script nests this in its
  // sandbox. No top-level redirect and no client answers are returned.
  return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Enquiry response</title></head><body><p>' + text + '</p><script>window.top.postMessage(' + payload + ',' + target + ');</script></body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
