/** @OnlyCurrentDoc */

const ONBOARDING_CONFIG = {
  sheetName: 'Bronagh Onboarding',
  maxRequestBytes: 26000000,
  maxFileBytes: 8 * 1024 * 1024,
  allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'webm', 'm4a', 'ogg'],
  allowedClientReference: 'CL-2026-001',
  allowedServiceCode: 'career_partner_bespoke',
  folderProperty: 'BRONAGH_UPLOAD_FOLDER_ID',
  submissionSecretProperty: 'BRONAGH_SUBMISSION_SECRET',
  paymentEmailSecretProperty: 'BRONAGH_PAYMENT_EMAIL_SECRET',
  paymentEmailSheetName: 'Payment confirmations'
};

const ONBOARDING_HEADERS = [
  'received_at', 'submission_id', 'client_reference', 'first_name', 'last_name', 'email', 'preferred_contact',
  'current_situation', 'work_history', 'employment_gaps', 'qualifications', 'things_you_do_well',
  'career_direction', 'priorities', 'working_arrangements', 'preferred_hours', 'contract_types',
  'availability', 'travel_limit', 'pay_needs', 'job_search_stage', 'job_search_difficulties',
  'example_jobs', 'deadline', 'success_outcomes', 'accessibility_consent', 'accessibility_discussion',
  'working_preferences', 'submission_folder', 'status'
];

function configureBronaghOnboarding() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from the dedicated onboarding spreadsheet.');
  ensureSheet_(spreadsheet);
  const folder = Drive.Files.create({
    name: 'CL-2026-001 - Bronagh - Onboarding uploads',
    mimeType: 'application/vnd.google-apps.folder'
  });
  PropertiesService.getScriptProperties().setProperty(ONBOARDING_CONFIG.folderProperty, folder.id);
  return 'Configured. Keep the spreadsheet and upload folder Restricted.';
}

function updateBronaghOnboardingSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from the dedicated onboarding spreadsheet.');
  ensureSheet_(spreadsheet);
  return 'The onboarding sheet headers are up to date.';
}

function setBronaghSubmissionSecret(secret) {
  const value = String(secret || '').trim();
  if (value.length < 32) throw new Error('Use a randomly generated secret of at least 32 characters.');
  PropertiesService.getScriptProperties().setProperty(ONBOARDING_CONFIG.submissionSecretProperty, value);
  return 'Submission secret saved.';
}

function setBronaghPaymentEmailSecret(secret) {
  const value = String(secret || '').trim();
  if (value.length < 32) throw new Error('Use a randomly generated secret of at least 32 characters.');
  PropertiesService.getScriptProperties().setProperty(ONBOARDING_CONFIG.paymentEmailSecretProperty, value);
  return 'Payment confirmation email secret saved.';
}

function doPost(e) {
  try {
    const raw = String(e && e.postData && e.postData.contents || '');
    if (!raw || raw.length > ONBOARDING_CONFIG.maxRequestBytes) throw new Error('Invalid request size.');
    const input = JSON.parse(raw);
    if (input.action === 'payment_confirmation') return sendPaymentConfirmation_(input);
    validate_(input);
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { save_(input); } finally { lock.releaseLock(); }
    return json_({ok: true, submissionId: input.submissionId});
  } catch (error) {
    console.error('Onboarding rejected: ' + error.message);
    return json_({ok: false, error: 'Submission could not be accepted.'});
  }
}

function sendPaymentConfirmation_(input) {
  validatePaymentConfirmation_(input);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = ensurePaymentConfirmationSheet_(SpreadsheetApp.getActiveSpreadsheet());
    const existing = sheet.getRange('A:A').createTextFinder(String(input.deliveryId)).matchEntireCell(true).findNext();
    if (existing) return json_({ok: true, duplicate: true});

    const earlyStartText = input.earlyStart
      ? 'You asked SABI to begin work before the end of the cancellation period. If you later cancel before the service is fully completed, a fair and proportionate amount may be deducted for work already supplied.'
      : 'SABI will not begin substantive personalised work until the 14-day cancellation period has ended, unless you separately ask for an earlier start.';
    const safeName = html_(input.firstName || 'there');
    const safeOnboardingUrl = html_(input.onboardingUrl);
    const htmlBody = '<div style="font-family:Arial,sans-serif;color:#173b3b;line-height:1.6;max-width:640px">'
      + '<p>Hello ' + safeName + ',</p>'
      + '<p>Thank you for your payment of £135 for the SABI Bespoke Career Partner Package.</p>'
      + '<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0"><tr><td style="border-radius:8px;background:#f2c94c">'
      + '<a href="' + safeOnboardingUrl + '" style="display:inline-block;padding:14px 22px;color:#063f3f;font-weight:bold;text-decoration:none">Open your private onboarding form</a>'
      + '</td></tr></table>'
      + '<p>If the button does not open, copy and paste this link into your browser:<br><a href="' + safeOnboardingUrl + '">' + safeOnboardingUrl + '</a></p>'
      + '<p>Please use the access password sent separately and do not forward the link or password. You can complete the form in your own time.</p>'
      + '<p>' + html_(earlyStartText) + '</p>'
      + '<p>Your Stripe payment receipt will arrive separately. You can save the <a href="' + html_(input.termsUrl) + '">Terms and Conditions</a>, <a href="' + html_(input.privacyUrl) + '">Privacy Policy</a> and <a href="' + html_(input.cancellationUrl) + '">cancellation form</a> from the links provided.</p>'
      + '<p>Once your onboarding is sent, SABI will review it and email any focused follow-up questions.</p>'
      + '<p>Kind regards,<br>SABI Career Support<br><a href="mailto:hello@sabigroup.co.uk">hello@sabigroup.co.uk</a></p>'
      + '</div>';

    sheet.appendRow([String(input.deliveryId), new Date(), String(input.checkoutSessionId), String(input.recipient), input.earlyStart ? 'Early start requested' : 'Standard start', 'Sending']);
    const recordRow = sheet.getLastRow();
    try {
      MailApp.sendEmail({
        to: String(input.recipient),
        subject: 'Your SABI Career Support payment and onboarding',
        body: 'Thank you for your £135 payment for the SABI Bespoke Career Partner Package. Open your private onboarding form: ' + input.onboardingUrl,
        htmlBody: htmlBody,
        name: 'SABI Career Support'
      });
      sheet.getRange(recordRow, 6).setValue('Sent');
    } catch (error) {
      sheet.deleteRow(recordRow);
      throw error;
    }
    return json_({ok: true});
  } finally {
    lock.releaseLock();
  }
}

function validatePaymentConfirmation_(input) {
  const required = ['deliveryId', 'checkoutSessionId', 'recipient', 'onboardingUrl', 'termsUrl', 'privacyUrl', 'cancellationUrl', 'deliveryToken'];
  required.forEach(key => { if (!String(input[key] || '').trim()) throw new Error('Payment confirmation missing ' + key + '.'); });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input.recipient))) throw new Error('Payment confirmation recipient invalid.');
  const secret = PropertiesService.getScriptProperties().getProperty(ONBOARDING_CONFIG.paymentEmailSecretProperty);
  if (!secret) throw new Error('Payment confirmation email secret not configured.');
  const clean = Object.assign({}, input); delete clean.deliveryToken;
  const encoded = Utilities.base64EncodeWebSafe(JSON.stringify(clean), Utilities.Charset.UTF_8).replace(/=+$/g, '');
  const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(encoded, secret, Utilities.Charset.UTF_8)).replace(/=+$/g, '');
  const parts = String(input.deliveryToken).split('.');
  if (parts.length !== 2 || !constantTimeEqual_(parts[0], encoded) || !constantTimeEqual_(parts[1], expected)) throw new Error('Payment confirmation signature invalid.');
}

function ensurePaymentConfirmationSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(ONBOARDING_CONFIG.paymentEmailSheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(ONBOARDING_CONFIG.paymentEmailSheetName);
    sheet.appendRow(['delivery_id', 'sent_at', 'checkout_session_id', 'recipient', 'start_arrangement', 'status']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function validate_(input) {
  if (input.clientReference !== ONBOARDING_CONFIG.allowedClientReference) throw new Error('Wrong client reference.');
  if (input.serviceCode !== ONBOARDING_CONFIG.allowedServiceCode) throw new Error('Wrong service code.');
  if (!/^[a-z0-9-]{20,80}$/i.test(String(input.submissionId || ''))) throw new Error('Invalid submission ID.');
  verifySubmissionToken_(input.submissionToken, input);
  if (!clean_(input.firstName, 120) || !clean_(input.lastName, 120)) throw new Error('Name required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input.email || ''))) throw new Error('Email required.');
  if (!['email', 'whatsapp', 'phone'].includes(String(input.preferredContact || ''))) throw new Error('Preferred contact required.');
  if (['whatsapp', 'phone'].includes(String(input.preferredContact || '')) && !String(input.telephone || '').trim()) throw new Error('Telephone number required for the selected contact method.');
  if (!['no', 'payer', 'supporter'].includes(String(input.supporter || ''))) throw new Error('Communication involvement choice required.');
  const situationOptions = ['employed', 'self-employed', 'not-working', 'first-job', 'education', 'caring', 'redundancy', 'leave', 'returning'];
  if (!Array.isArray(input.currentSituation) || !input.currentSituation.some(value => situationOptions.includes(value))) throw new Error('Current situation required.');
  if (input.ageEligible !== 'yes') throw new Error('Age eligibility required.');
  if (!clean_(input.broadDirection, 5000)) throw new Error('Broad direction required.');
  if (!includesYes_(input.clientDeclaration)) throw new Error('Client declaration missing.');
  if (clean_(input.accessibilityNeeds, 5000) && !includesYes_(input.specialCategoryConsent)) throw new Error('Sensitive information supplied without consent.');
  (input.files || []).forEach(file => {
    const ext = String(file.name || '').split('.').pop().toLowerCase();
    if (!ONBOARDING_CONFIG.allowedExtensions.includes(ext)) throw new Error('File type rejected.');
    if (!Number.isFinite(Number(file.size)) || Number(file.size) > ONBOARDING_CONFIG.maxFileBytes) throw new Error('File too large.');
    if (!file.base64) throw new Error('Missing file data.');
  });
}

function verifySubmissionToken_(token, input) {
  const secret = PropertiesService.getScriptProperties().getProperty(ONBOARDING_CONFIG.submissionSecretProperty);
  if (!secret) throw new Error('Submission secret not configured.');
  const parts = String(token || '').split('.');
  if (parts.length !== 2) throw new Error('Missing submission token.');

  const encodedClaims = parts[0];
  const suppliedSignature = parts[1];
  const expectedBytes = Utilities.computeHmacSha256Signature(encodedClaims, secret, Utilities.Charset.UTF_8);
  const expectedSignature = Utilities.base64EncodeWebSafe(expectedBytes).replace(/=+$/g, '');
  if (!constantTimeEqual_(suppliedSignature, expectedSignature)) throw new Error('Invalid submission token.');

  let claims;
  try {
    const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(encodedClaims)).getDataAsString();
    claims = JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid token claims.');
  }

  if (!Number.isFinite(Number(claims.exp)) || Number(claims.exp) < Date.now()) throw new Error('Expired submission token.');
  if (claims.submissionId !== input.submissionId) throw new Error('Submission token mismatch.');
  if (claims.clientReference !== input.clientReference) throw new Error('Client token mismatch.');
  if (claims.serviceCode !== input.serviceCode) throw new Error('Service token mismatch.');
}

function constantTimeEqual_(left, right) {
  left = String(left || '');
  right = String(right || '');
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

function save_(input) {
  const sheet = ensureSheet_(SpreadsheetApp.getActiveSpreadsheet());
  const existing = sheet.getRange('B:B').createTextFinder(input.submissionId).matchEntireCell(true).findNext();
  if (existing) return;
  const folderId = PropertiesService.getScriptProperties().getProperty(ONBOARDING_CONFIG.folderProperty);
  if (!folderId) throw new Error('Upload folder not configured.');
  const submissionFolder = Drive.Files.create({
    name: input.submissionId,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [folderId]
  });
  const uploadRows = [];
  try {
    (input.files || []).forEach(file => {
      const bytes = Utilities.base64Decode(file.base64);
      if (bytes.length > ONBOARDING_CONFIG.maxFileBytes) throw new Error('Decoded file too large.');
      const safeName = String(file.name).replace(/[^a-z0-9._ -]/gi, '_').slice(0, 180);
      const blob = Utilities.newBlob(bytes, file.type || 'application/octet-stream', safeName);
      const created = Drive.Files.create({name: safeName, parents: [submissionFolder.id]}, blob);
      uploadRows.push({field: file.field, name: safeName, id: created.id, url: driveUrl_(created.id)});
    });
    const snapshot = Object.assign({}, input, {files: uploadRows});
    delete snapshot.submissionToken;
    const snapshotBlob = Utilities.newBlob(JSON.stringify(snapshot, null, 2), MimeType.PLAIN_TEXT, 'onboarding-response.json');
    Drive.Files.create({name: 'onboarding-response.json', parents: [submissionFolder.id]}, snapshotBlob);
    appendSummaryRow_(sheet, input, driveUrl_(submissionFolder.id));
  } catch (error) {
    Drive.Files.update({trashed: true}, submissionFolder.id);
    throw error;
  }
}

function ensureSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(ONBOARDING_CONFIG.sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(ONBOARDING_CONFIG.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ONBOARDING_HEADERS);
    sheet.setFrozenRows(1);
  } else {
    const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    const missing = ONBOARDING_HEADERS.filter(header => !existing.includes(header));
    if (missing.length) sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

function appendSummaryRow_(sheet, input, folderUrl) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const values = {
    received_at: new Date(),
    submission_id: input.submissionId,
    client_reference: input.clientReference,
    first_name: input.firstName,
    last_name: input.lastName,
    email: String(input.email || '').toLowerCase(),
    preferred_contact: input.preferredContact,
    current_situation: list_(input.currentSituation),
    work_history: input.workHistory,
    employment_gaps: input.employmentGapsSummary,
    qualifications: input.qualificationsSummary,
    things_you_do_well: input.skills,
    career_direction: input.broadDirection,
    priorities: list_(input.priorities),
    working_arrangements: list_(input.workplace),
    preferred_hours: list_(input.hours),
    contract_types: list_(input.contractTypes),
    availability: input.availability,
    travel_limit: input.travelLimit,
    pay_needs: input.payNeeds,
    job_search_stage: input.searchStage,
    job_search_difficulties: list_(input.difficultParts),
    example_jobs: input.exampleJobs,
    deadline: input.deadlineGate === 'yes' ? input.deadline : (input.deadlineGate === 'no' ? 'No deadline' : 'Not sure yet'),
    success_outcomes: input.successOutcome,
    accessibility_consent: includesYes_(input.specialCategoryConsent) ? 'Yes' : 'No',
    accessibility_discussion: input.accessibilityDiscussion,
    working_preferences: input.workingPreferences,
    submission_folder: folderUrl,
    status: 'New'
  };
  sheet.appendRow(headers.map(header => header === 'received_at' ? values[header] : safeCell_(values[header])));
}

function includesYes_(value) { return value === 'yes' || value === true || (Array.isArray(value) && value.includes('yes')); }
function list_(value) { return Array.isArray(value) ? value.join(', ') : String(value || ''); }
function clean_(value, limit) { return String(value == null ? '' : value).replace(/\u0000/g, '').trim().slice(0, limit); }
function safeCell_(value) { const text = clean_(value, 50000); return /^[=+\-@]/.test(text) ? "'" + text : text; }
function driveUrl_(id) { return 'https://drive.google.com/open?id=' + encodeURIComponent(id); }
function html_(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
