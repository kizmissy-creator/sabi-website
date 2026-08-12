/** @OnlyCurrentDoc */

const ONBOARDING_CONFIG = {
  sheetName: 'Bronagh Onboarding',
  maxRequestBytes: 26000000,
  maxFileBytes: 12 * 1024 * 1024,
  abandonedUploadDays: 90,
  allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'webm', 'm4a', 'ogg'],
  documentFields: ['existingCv', 'vacancyDocument', 'applicationDocument'],
  allowedClientReference: 'CL-2026-001',
  allowedServiceCode: 'career_partner_bespoke',
  folderProperty: 'BRONAGH_UPLOAD_FOLDER_ID',
  submissionSecretProperty: 'BRONAGH_SUBMISSION_SECRET',
  paymentEmailSecretProperty: 'BRONAGH_PAYMENT_EMAIL_SECRET',
  paymentEmailSheetName: 'Payment confirmations',
  ownerNotificationEmail: 'info@sabigroup.co.uk'
};

const ONBOARDING_HEADERS = [
  'received_at', 'submission_id', 'client_reference', 'first_name', 'last_name', 'email', 'preferred_contact',
  'current_situation', 'work_history', 'employment_gaps', 'qualifications', 'things_you_do_well',
  'career_direction', 'priorities', 'working_arrangements', 'preferred_hours', 'contract_types',
  'availability', 'travel_limit', 'pay_needs', 'job_search_stage', 'job_search_difficulties',
  'example_jobs', 'deadline', 'success_outcomes', 'accessibility_consent', 'accessibility_discussion',
  'follow_up_discussion', 'working_preferences', 'response_document', 'submission_folder', 'status', 'notification_status'
];

const ONBOARDING_REPORT_SECTIONS = [
  {title: 'About you', fields: [
    ['firstName', 'First name'], ['lastName', 'Last name'], ['preferredName', 'Preferred name'], ['pronouns', 'Pronouns'],
    ['email', 'Email address'], ['telephone', 'Telephone number'], ['preferredContact', 'Preferred contact'], ['location', 'Area']
  ]},
  {title: 'Your situation', fields: [
    ['currentSituation', 'Current situation'], ['currentSituationOther', 'Anything else about the current situation'],
    ['searchStageNotes', 'Anything else about where things are now']
  ]},
  {title: 'Your experience', fields: [
    ['noExperience', 'No work or other experience to add'], ['employmentHistory', 'Work and other experience'], ['employmentGaps', 'Employment gaps'],
    ['noQualifications', 'No qualifications, training, licences or certificates to add'], ['qualifications', 'Qualifications, training, licences or certificates'],
    ['englishMathsStatus', 'English and maths information']
  ]},
  {title: 'What you bring', fields: [
    ['hobbies', 'Hobbies or interests'], ['interests', 'Tasks that hold attention'], ['caringStrengths', 'Caring responsibilities and transferable strengths'],
    ['skillsExamples', 'What someone who knows you well might say'], ['strengthAttributes', 'Things you consider yourself good at'],
    ['practicalSkillAreas', 'Practical skill areas'], ['practicalSkills', 'Practical skills or knowledge'], ['proudOf', 'Something you feel pleased or proud about']
  ]},
  {title: 'What comes next', fields: [
    ['broadDirection', 'Roles or types of work being considered'], ['targetSectors', 'Sectors or settings that interest you'],
    ['rolesToAvoid', 'Roles or settings to avoid'], ['priorities', 'What matters most'], ['priorityNotes', 'Anything else that matters'],
    ['workplace', 'Preferred working arrangements'], ['hours', 'Hours or working patterns'], ['hoursOther', 'Other hours or pattern'],
    ['contractTypes', 'Contract types'], ['travelLimit', 'Maximum commute or travel'], ['availability', 'Available from'], ['payNeeds', 'Pay needs or expectations']
  ]},
  {title: 'Your job search', fields: [
    ['searchStage', 'Current job-search stage'], ['difficultParts', 'Parts of searching or applying that feel hardest'],
    ['difficultPartsOther', 'Something else that feels difficult'], ['exampleOpportunities', 'Vacancies, roles or organisations of interest'],
    ['deadlineGate', 'Has a deadline'], ['deadlineType', 'Deadline type'], ['deadline', 'Deadline date'], ['deadlineNotes', 'Deadline notes'],
    ['applicationDraft', 'Application or supporting statement'], ['successOutcomes', 'What would make the service feel successful'],
    ['successOutcomeOther', 'Other successful outcome']
  ]},
  {title: 'Documents and links', fields: [
    ['documentUrl', 'Document or profile links'], ['documentNotes', 'Documents to send later']
  ]},
  {title: 'Working together', fields: [
    ['specialCategoryConsent', 'Consent to use health, disability or neurodivergence information'],
    ['accessibilityNeeds', 'Accessibility or adjustment information'], ['accessibilityDiscussion', 'Who to discuss accessibility or adjustments with'],
    ['followUpDiscussion', 'Optional follow-up discussion'], ['workingPreferences', 'How to work together'], ['supporter', 'Anyone else involved'],
    ['supporterName', 'Supporter name'], ['supporterRelationship', 'Supporter relationship'], ['supporterContact', 'Supporter contact details'],
    ['supporterRole', 'What the supporter may help with']
  ]},
  {title: 'Declarations', fields: [
    ['termsAccepted', 'Terms accepted'], ['earlyStart', 'Early start requested'], ['clientDeclaration', 'Client declaration']
  ]}
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
    if (input.action === 'file_upload') return uploadFile_(input);
    if (input.action === 'file_status') return uploadStatus_(input);
    if (input.action === 'file_delete') return deleteFile_(input);
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
      + '<p>Please use the access password SABI will send separately. For security, the password is not included in this email. Please do not forward the link or password. You can complete the form in your own time.</p>'
      + '<p>' + html_(earlyStartText) + '</p>'
      + '<p>Your Stripe payment receipt will arrive separately. You can save the <a href="' + html_(input.termsUrl) + '">Terms and Conditions</a>, <a href="' + html_(input.privacyUrl) + '">Privacy Policy</a> and <a href="' + html_(input.cancellationUrl) + '">cancellation form</a> from the links provided.</p>'
      + '<p>Once your onboarding is sent, SABI will review it and email any focused follow-up questions.</p>'
      + '<p>Kind regards,<br>SABI Career Support<br><a href="mailto:hello@sabigroup.co.uk">hello@sabigroup.co.uk</a></p>'
      + '</div>';

    sheet.appendRow([String(input.deliveryId), new Date(), String(input.checkoutSessionId), String(input.recipient), input.earlyStart ? 'Early start requested' : 'Standard start', 'Sending']);
    const recordRow = sheet.getLastRow();
    try {
      MailApp.sendEmail({
        to: ONBOARDING_CONFIG.ownerNotificationEmail,
        subject: 'Action needed: Bronagh payment received, send access password',
        body: 'Stripe has confirmed Bronagh\'s £135 Career Partner payment. The onboarding confirmation email is being sent to ' + String(input.recipient) + '. Please now send Bronagh the separate access password. For security, do not include the password in the same email as the onboarding link.',
        name: 'SABI Career Support'
      });
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

function validateUploadIdentity_(input) {
  if (input.clientReference !== ONBOARDING_CONFIG.allowedClientReference) throw new Error('Wrong client reference.');
  if (input.serviceCode !== ONBOARDING_CONFIG.allowedServiceCode) throw new Error('Wrong service code.');
  if (!/^[a-z0-9-]{20,80}$/i.test(String(input.submissionId || ''))) throw new Error('Invalid submission ID.');
  verifySubmissionToken_(input.submissionToken, input);
}

function validateDocumentFile_(file) {
  const field = String(file && file.field || '');
  const name = String(file && file.name || '');
  const ext = name.split('.').pop().toLowerCase();
  if (!ONBOARDING_CONFIG.documentFields.includes(field)) throw new Error('Unknown document category.');
  if (!ONBOARDING_CONFIG.allowedExtensions.includes(ext) || ['webm', 'm4a', 'ogg'].includes(ext)) throw new Error('File type rejected.');
  if (!Number.isFinite(Number(file.size)) || Number(file.size) <= 0 || Number(file.size) > ONBOARDING_CONFIG.maxFileBytes) throw new Error('File too large.');
  if (!file.base64) throw new Error('Missing file data.');
}

function uploadFile_(input) {
  validateUploadIdentity_(input);
  const requestId = String(input.uploadRequestId || '');
  if (!/^[a-z0-9-]{20,80}$/i.test(requestId)) throw new Error('Invalid upload request ID.');
  try {
    validateDocumentFile_(input.file);
    const bytes = Utilities.base64Decode(input.file.base64);
    if (bytes.length !== Number(input.file.size) || bytes.length > ONBOARDING_CONFIG.maxFileBytes) throw new Error('Decoded file size is invalid.');
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    let result;
    try {
      const folder = getOrCreateSubmissionFolder_(input.submissionId);
      const safeName = safeFileName_(input.file.name);
      const blob = Utilities.newBlob(bytes, input.file.type || 'application/octet-stream', safeName);
      const created = Drive.Files.create({name: safeName, parents: [folder.id]}, blob);
      result = {ok: true, upload: {
      id: created.id,
      field: String(input.file.field),
      name: safeName,
      type: String(input.file.type || 'application/octet-stream'),
      size: bytes.length
      }};
    } finally {
      lock.releaseLock();
    }
    CacheService.getScriptCache().put(uploadResultKey_(requestId), JSON.stringify(result), 21600);
    return json_(result);
  } catch (error) {
    CacheService.getScriptCache().put(uploadResultKey_(requestId), JSON.stringify({ok: false, error: 'The document could not be uploaded.'}), 21600);
    throw error;
  }
}

function uploadStatus_(input) {
  validateUploadIdentity_(input);
  const requestId = String(input.uploadRequestId || '');
  if (!/^[a-z0-9-]{20,80}$/i.test(requestId)) throw new Error('Invalid upload request ID.');
  const value = CacheService.getScriptCache().get(uploadResultKey_(requestId));
  return value ? json_(JSON.parse(value)) : json_({ok: true, pending: true});
}

function uploadResultKey_(requestId) {
  return 'bronagh-upload-' + requestId;
}

function deleteFile_(input) {
  validateUploadIdentity_(input);
  const uploadId = String(input.uploadId || '');
  if (!/^[a-z0-9_-]{10,180}$/i.test(uploadId)) throw new Error('Invalid upload reference.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const folder = findSubmissionFolder_(input.submissionId);
    if (!folder) return json_({ok: true, missing: true});
    const file = Drive.Files.get(uploadId, {fields: 'id,parents,trashed'});
    if (file.trashed || !Array.isArray(file.parents) || !file.parents.includes(folder.id)) throw new Error('Upload does not belong to this submission.');
    Drive.Files.update({trashed: true}, uploadId);
    return json_({ok: true, uploadId: uploadId});
  } finally {
    lock.releaseLock();
  }
}

function safeFileName_(name) {
  const safe = String(name || '').replace(/[^a-z0-9._ -]/gi, '_').replace(/\s+/g, ' ').trim().slice(0, 180);
  if (!safe || safe === '.' || safe === '..') throw new Error('Invalid file name.');
  return safe;
}

function findSubmissionFolder_(submissionId) {
  const rootId = PropertiesService.getScriptProperties().getProperty(ONBOARDING_CONFIG.folderProperty);
  if (!rootId) throw new Error('Upload folder not configured.');
  const escapedName = String(submissionId).replace(/'/g, "\\'");
  const result = Drive.Files.list({
    q: "'" + rootId + "' in parents and name = '" + escapedName + "' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: 'files(id,name,createdTime)',
    pageSize: 10
  });
  return result.files && result.files.length ? result.files[0] : null;
}

function getOrCreateSubmissionFolder_(submissionId) {
  const existing = findSubmissionFolder_(submissionId);
  if (existing) return existing;
  const rootId = PropertiesService.getScriptProperties().getProperty(ONBOARDING_CONFIG.folderProperty);
  return Drive.Files.create({
    name: String(submissionId),
    mimeType: 'application/vnd.google-apps.folder',
    parents: [rootId]
  });
}

function verifiedStoredUploads_(input, folderId) {
  return (input.uploads || []).map(upload => {
    const stored = Drive.Files.get(String(upload.id), {fields: 'id,name,mimeType,size,parents,trashed'});
    if (stored.trashed || !Array.isArray(stored.parents) || !stored.parents.includes(folderId)) throw new Error('Uploaded document does not belong to this submission.');
    if (String(stored.name) !== String(upload.name) || Number(stored.size) !== Number(upload.size)) throw new Error('Uploaded document details do not match.');
    return {
      field: String(upload.field),
      name: String(stored.name),
      type: String(stored.mimeType || upload.type || 'application/octet-stream'),
      size: Number(stored.size),
      id: String(stored.id),
      url: driveUrl_(stored.id)
    };
  });
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
  (input.uploads || []).forEach(upload => {
    if (!ONBOARDING_CONFIG.documentFields.includes(String(upload.field || ''))) throw new Error('Unknown uploaded document category.');
    if (!/^[a-z0-9_-]{10,180}$/i.test(String(upload.id || ''))) throw new Error('Invalid uploaded document reference.');
    if (!clean_(upload.name, 180)) throw new Error('Uploaded document name missing.');
    if (!Number.isFinite(Number(upload.size)) || Number(upload.size) <= 0 || Number(upload.size) > ONBOARDING_CONFIG.maxFileBytes) throw new Error('Uploaded document size invalid.');
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
  const submissionFolder = getOrCreateSubmissionFolder_(input.submissionId);
  const uploadRows = verifiedStoredUploads_(input, submissionFolder.id);
  try {
    (input.files || []).forEach(file => {
      const bytes = Utilities.base64Decode(file.base64);
      if (bytes.length > ONBOARDING_CONFIG.maxFileBytes) throw new Error('Decoded file too large.');
      const safeName = safeFileName_(file.name);
      const blob = Utilities.newBlob(bytes, file.type || 'application/octet-stream', safeName);
      const created = Drive.Files.create({name: safeName, parents: [submissionFolder.id]}, blob);
      uploadRows.push({field: file.field, name: safeName, type: file.type || 'application/octet-stream', size: bytes.length, id: created.id, url: driveUrl_(created.id)});
    });
    const snapshot = Object.assign({}, input, {files: uploadRows});
    delete snapshot.submissionToken;
    delete snapshot.uploads;
    const snapshotBlob = Utilities.newBlob(JSON.stringify(snapshot, null, 2), MimeType.PLAIN_TEXT, 'onboarding-response.json');
    Drive.Files.create({name: 'onboarding-response.json', parents: [submissionFolder.id]}, snapshotBlob);
    const responseDocument = createReadableOnboardingDocument_(snapshot, submissionFolder.id);
    const summary = appendSummaryRow_(sheet, input, driveUrl_(submissionFolder.id), responseDocument.url);
    try {
      sendOnboardingArrivalNotification_(input, responseDocument.url, driveUrl_(submissionFolder.id));
      sheet.getRange(summary.row, summary.notificationColumn).setValue('Sent');
    } catch (notificationError) {
      sheet.getRange(summary.row, summary.notificationColumn).setValue('Failed');
      console.error('Onboarding arrival notification failed: ' + notificationError.message);
    }
  } catch (error) {
    throw error;
  }
}

function installBronaghUploadCleanupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'cleanupAbandonedBronaghUploads')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('cleanupAbandonedBronaghUploads').timeBased().everyDays(1).atHour(3).create();
  return 'Daily cleanup trigger installed.';
}

function cleanupAbandonedBronaghUploads() {
  const rootId = PropertiesService.getScriptProperties().getProperty(ONBOARDING_CONFIG.folderProperty);
  if (!rootId) throw new Error('Upload folder not configured.');
  const sheet = ensureSheet_(SpreadsheetApp.getActiveSpreadsheet());
  const submittedIds = new Set(sheet.getLastRow() > 1 ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat().map(String) : []);
  const cutoff = Date.now() - ONBOARDING_CONFIG.abandonedUploadDays * 24 * 60 * 60 * 1000;
  let pageToken;
  let removed = 0;
  do {
    const result = Drive.Files.list({
      q: "'" + rootId + "' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'nextPageToken,files(id,name,createdTime)',
      pageSize: 100,
      pageToken: pageToken
    });
    (result.files || []).forEach(folder => {
      if (!submittedIds.has(String(folder.name)) && new Date(folder.createdTime).getTime() < cutoff) {
        Drive.Files.update({trashed: true}, folder.id);
        removed += 1;
      }
    });
    pageToken = result.nextPageToken;
  } while (pageToken);
  return 'Removed ' + removed + ' abandoned upload folder(s).';
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

function appendSummaryRow_(sheet, input, folderUrl, responseDocumentUrl) {
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
    follow_up_discussion: input.followUpDiscussion,
    working_preferences: input.workingPreferences,
    response_document: responseDocumentUrl,
    submission_folder: folderUrl,
    status: 'New',
    notification_status: 'Pending'
  };
  sheet.appendRow(headers.map(header => header === 'received_at' ? values[header] : safeCell_(values[header])));
  return {row: sheet.getLastRow(), notificationColumn: headers.indexOf('notification_status') + 1};
}

function createReadableOnboardingDocument_(input, folderId) {
  const clientName = [clean_(input.firstName, 120), clean_(input.lastName, 120)].filter(Boolean).join(' ') || 'Bronagh';
  const receivedAt = Utilities.formatDate(new Date(), ONBOARDING_CONFIG.timeZone || Session.getScriptTimeZone(), 'd MMMM yyyy, HH:mm');
  const sections = ONBOARDING_REPORT_SECTIONS.map(section => {
    const rows = section.fields.map(field => reportRow_(field[1], input[field[0]])).filter(Boolean).join('');
    return rows ? '<section><h2>' + html_(section.title) + '</h2>' + rows + '</section>' : '';
  }).filter(Boolean).join('');
  const files = reportFiles_(input.files || []);
  const htmlContent = '<!doctype html><html><head><meta charset="utf-8"><style>'
    + 'body{font-family:Arial,sans-serif;color:#173b3b;line-height:1.5}h1{color:#156d6b;font-size:28px;margin-bottom:4px}'
    + 'h2{color:#156d6b;font-size:20px;border-bottom:2px solid #f2c94c;padding-bottom:5px;margin-top:28px}'
    + 'h3{color:#0e5553;font-size:15px;margin:16px 0 4px}p{margin:4px 0 10px}table{border-collapse:collapse;width:100%;margin:8px 0 16px}'
    + 'th,td{border:1px solid #cbdad9;padding:7px;text-align:left;vertical-align:top}th{background:#e7f3f2}.meta{color:#465756;font-size:12px}'
    + '.entry{border-left:3px solid #f2c94c;padding-left:12px;margin:10px 0}.empty{color:#687675;font-style:italic}</style></head><body>'
    + '<h1>SABI Career Partner onboarding</h1><p><strong>' + html_(clientName) + '</strong></p>'
    + '<p class="meta">Client reference: ' + html_(input.clientReference) + '<br>Submission reference: ' + html_(input.submissionId)
    + '<br>Received: ' + html_(receivedAt) + '</p><p class="meta">Unanswered optional questions are not shown.</p>'
    + sections + files + '</body></html>';
  const blob = Utilities.newBlob(htmlContent, 'text/html', 'Bronagh onboarding response.html');
  const created = Drive.Files.create({
    name: 'Bronagh - Onboarding response',
    mimeType: 'application/vnd.google-apps.document',
    parents: [folderId]
  }, blob, {fields: 'id,name,webViewLink'});
  return {id: created.id, url: created.webViewLink || ('https://docs.google.com/document/d/' + encodeURIComponent(created.id) + '/edit')};
}

function reportRow_(label, value) {
  if (!hasReportValue_(value)) return '';
  return '<div><h3>' + html_(label) + '</h3>' + reportValueHtml_(value) + '</div>';
}

function hasReportValue_(value) {
  if (Array.isArray(value)) return value.some(hasReportValue_);
  if (value && typeof value === 'object') return Object.keys(value).some(key => hasReportValue_(value[key]));
  if (typeof value === 'boolean') return true;
  return String(value == null ? '' : value).trim() !== '';
}

function reportValueHtml_(value) {
  if (Array.isArray(value)) {
    if (value.every(item => !item || typeof item !== 'object')) {
      return '<ul>' + value.filter(hasReportValue_).map(item => '<li>' + html_(humaniseReportValue_(item)) + '</li>').join('') + '</ul>';
    }
    return value.filter(hasReportValue_).map((item, index) => '<div class="entry"><strong>Entry ' + (index + 1) + '</strong>' + reportObjectTable_(item) + '</div>').join('');
  }
  if (value && typeof value === 'object') return reportObjectTable_(value);
  const text = humaniseReportValue_(value);
  return '<p>' + html_(text).replace(/\n/g, '<br>') + '</p>';
}

function reportObjectTable_(value) {
  const rows = Object.keys(value || {}).filter(key => hasReportValue_(value[key])).map(key =>
    '<tr><th>' + html_(humaniseReportKey_(key)) + '</th><td>' + reportValueHtml_(value[key]) + '</td></tr>'
  ).join('');
  return rows ? '<table>' + rows + '</table>' : '<p class="empty">No details supplied.</p>';
}

function humaniseReportKey_(value) {
  return String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, first => first.toUpperCase());
}

function humaniseReportValue_(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value == null ? '' : value).trim();
  if (text === 'yes') return 'Yes';
  if (text === 'no') return 'No';
  if (/^\d{4}-\d{2}(?:-\d{2})?$/.test(text)) return text;
  if (/^[a-z0-9]+(?:[_-][a-z0-9]+)+$/i.test(text)) return text.replace(/[_-]+/g, ' ').replace(/^./, first => first.toUpperCase());
  return text;
}

function reportFiles_(files) {
  if (!Array.isArray(files) || !files.length) return '';
  const rows = files.map(file => '<tr><td>' + html_(humaniseReportKey_(String(file.field || '').replace(/^voice_/, 'Voice answer: ')))
    + '</td><td>' + html_(file.name) + '</td><td><a href="' + html_(file.url) + '">Open in Drive</a></td></tr>').join('');
  return '<section><h2>Documents and recordings received</h2><table><tr><th>Type</th><th>File</th><th>Link</th></tr>' + rows + '</table></section>';
}

function sendOnboardingArrivalNotification_(input, responseDocumentUrl, folderUrl) {
  const clientName = [clean_(input.firstName, 120), clean_(input.lastName, 120)].filter(Boolean).join(' ') || 'Bronagh';
  const subject = clientName + "'s onboarding has arrived";
  const body = clientName + "'s Career Partner onboarding has been received.\n\nSubmission reference: " + input.submissionId
    + '\nReadable response: ' + responseDocumentUrl + '\nSubmission folder: ' + folderUrl
    + '\n\nThe email contains no onboarding answers or attachments. Open the restricted Google Doc to review the response.';
  const htmlBody = '<div style="font-family:Arial,sans-serif;color:#173b3b;line-height:1.6;max-width:640px"><p><strong>' + html_(clientName)
    + "'s Career Partner onboarding has been received.</strong></p><p>Submission reference: " + html_(input.submissionId)
    + '</p><p><a href="' + html_(responseDocumentUrl) + '">Open the readable onboarding response</a><br><a href="' + html_(folderUrl)
    + '">Open the restricted submission folder</a></p><p>This notification contains no onboarding answers or attachments.</p></div>';
  MailApp.sendEmail({to: ONBOARDING_CONFIG.ownerNotificationEmail, subject: subject, body: body, htmlBody: htmlBody, name: 'SABI Career Support'});
}

function includesYes_(value) { return value === 'yes' || value === true || (Array.isArray(value) && value.includes('yes')); }
function list_(value) { return Array.isArray(value) ? value.join(', ') : String(value || ''); }
function clean_(value, limit) { return String(value == null ? '' : value).replace(/\u0000/g, '').trim().slice(0, limit); }
function safeCell_(value) { const text = clean_(value, 50000); return /^[=+\-@]/.test(text) ? "'" + text : text; }
function driveUrl_(id) { return 'https://drive.google.com/open?id=' + encodeURIComponent(id); }
function html_(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
