/** @OnlyCurrentDoc */

const ONBOARDING_CONFIG = {
  sheetName: 'Bronagh Onboarding',
  maxRequestBytes: 26000000,
  maxFileBytes: 8 * 1024 * 1024,
  allowedExtensions: ['pdf', 'doc', 'docx', 'txt'],
  allowedClientReference: 'CL-2026-001',
  allowedServiceCode: 'career_partner_bespoke',
  folderProperty: 'BRONAGH_UPLOAD_FOLDER_ID'
};

function configureBronaghOnboarding() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from the dedicated onboarding spreadsheet.');
  ensureSheet_(spreadsheet);
  const folder = DriveApp.createFolder('CL-2026-001 - Bronagh - Onboarding uploads');
  PropertiesService.getScriptProperties().setProperty(ONBOARDING_CONFIG.folderProperty, folder.getId());
  return 'Configured. Keep the spreadsheet and upload folder Restricted.';
}

function doPost(e) {
  try {
    const raw = String(e && e.postData && e.postData.contents || '');
    if (!raw || raw.length > ONBOARDING_CONFIG.maxRequestBytes) throw new Error('Invalid request size.');
    const input = JSON.parse(raw);
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

function validate_(input) {
  if (input.clientReference !== ONBOARDING_CONFIG.allowedClientReference) throw new Error('Wrong client reference.');
  if (input.serviceCode !== ONBOARDING_CONFIG.allowedServiceCode) throw new Error('Wrong service code.');
  if (!/^[a-z0-9-]{20,80}$/i.test(String(input.submissionId || ''))) throw new Error('Invalid submission ID.');
  if (!clean_(input.firstName, 120) || !clean_(input.lastName, 120)) throw new Error('Name required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input.email || ''))) throw new Error('Email required.');
  if (input.ageEligible !== 'yes') throw new Error('Age eligibility required.');
  if (!clean_(input.broadDirection, 5000)) throw new Error('Broad direction required.');
  if (!includesYes_(input.termsAccepted) || !includesYes_(input.clientDeclaration)) throw new Error('Required declarations missing.');
  if (clean_(input.accessibilityNeeds, 5000) && !includesYes_(input.specialCategoryConsent)) throw new Error('Sensitive information supplied without consent.');
  (input.files || []).forEach(file => {
    const ext = String(file.name || '').split('.').pop().toLowerCase();
    if (!ONBOARDING_CONFIG.allowedExtensions.includes(ext)) throw new Error('File type rejected.');
    if (!Number.isFinite(Number(file.size)) || Number(file.size) > ONBOARDING_CONFIG.maxFileBytes) throw new Error('File too large.');
    if (!file.base64) throw new Error('Missing file data.');
  });
}

function save_(input) {
  const sheet = ensureSheet_(SpreadsheetApp.getActiveSpreadsheet());
  const existing = sheet.getRange('B:B').createTextFinder(input.submissionId).matchEntireCell(true).findNext();
  if (existing) return;
  const folderId = PropertiesService.getScriptProperties().getProperty(ONBOARDING_CONFIG.folderProperty);
  if (!folderId) throw new Error('Upload folder not configured.');
  const root = DriveApp.getFolderById(folderId);
  const submissionFolder = root.createFolder(input.submissionId);
  const uploadRows = [];
  try {
    (input.files || []).forEach(file => {
      const bytes = Utilities.base64Decode(file.base64);
      if (bytes.length > ONBOARDING_CONFIG.maxFileBytes) throw new Error('Decoded file too large.');
      const safeName = String(file.name).replace(/[^a-z0-9._ -]/gi, '_').slice(0, 180);
      const created = submissionFolder.createFile(Utilities.newBlob(bytes, file.type || 'application/octet-stream', safeName));
      uploadRows.push({field: file.field, name: safeName, id: created.getId(), url: created.getUrl()});
    });
    const snapshot = Object.assign({}, input, {files: uploadRows});
    submissionFolder.createFile('onboarding-response.json', JSON.stringify(snapshot, null, 2), MimeType.PLAIN_TEXT);
    sheet.appendRow([
      new Date(), safeCell_(input.submissionId), safeCell_(input.clientReference), safeCell_(input.firstName),
      safeCell_(input.lastName), safeCell_(String(input.email).toLowerCase()), safeCell_(input.preferredContact),
      safeCell_(input.deadline), safeCell_(input.broadDirection), safeCell_(input.targetedDocuments),
      includesYes_(input.specialCategoryConsent) ? 'Yes' : 'No', includesYes_(input.earlyStart) ? 'Requested' : 'Not requested',
      safeCell_(submissionFolder.getUrl()), 'New'
    ]);
  } catch (error) {
    submissionFolder.setTrashed(true);
    throw error;
  }
}

function ensureSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(ONBOARDING_CONFIG.sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(ONBOARDING_CONFIG.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['received_at','submission_id','client_reference','first_name','last_name','email','preferred_contact','deadline','broad_direction','targeted_documents','sensitive_consent','early_start','submission_folder','status']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function includesYes_(value) { return value === 'yes' || value === true || (Array.isArray(value) && value.includes('yes')); }
function clean_(value, limit) { return String(value == null ? '' : value).replace(/\u0000/g, '').trim().slice(0, limit); }
function safeCell_(value) { const text = clean_(value, 50000); return /^[=+\-@]/.test(text) ? "'" + text : text; }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
