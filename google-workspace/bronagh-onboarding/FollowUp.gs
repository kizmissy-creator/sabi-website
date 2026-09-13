// Additive receiver: keep the existing onboarding and payment routes unchanged.
function receiveCareerFollowUp_(input) {
  const payload = String(input.payload || '');
  if (!payload || payload.length > 500000) throw new Error('Invalid follow-up size.');
  const testOnly = input.testOnly === true;
  const secret = PropertiesService.getScriptProperties().getProperty(testOnly ? 'TESTER_SUBMISSION_SECRET' : 'BRONAGH_SUBMISSION_SECRET');
  if (!secret) throw new Error('Follow-up signing is unavailable.');
  const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature('follow-up-v1\n' + payload, secret, Utilities.Charset.UTF_8)).replace(/=+$/g, '');
  if (!constantTimeEqual_(expected, String(input.signature || ''))) throw new Error('Invalid follow-up signature.');
  const envelope = JSON.parse(payload);
  const item = envelope.submission;
  if (testOnly && (!item || item.testMode !== true)) throw new Error('Tester credentials cannot submit client answers.');
  if (envelope.action !== 'career_partner_follow_up' || !Number.isFinite(envelope.expiresAt) || envelope.expiresAt < Date.now() || envelope.expiresAt > Date.now() + 10 * 60 * 1000 ||
    !item || item.clientReference !== 'CL-2026-001' || item.formType !== 'career_partner_follow_up' ||
    !/^[a-f0-9-]{36}$/i.test(item.submissionId || '') || typeof item.testMode !== 'boolean' ||
    typeof item.reviewText !== 'string' || !item.reviewText.trim()) throw new Error('Invalid follow-up.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = item.testMode ? 'Follow-up tests' : 'Bronagh Follow-up';
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      sheet.appendRow(['received_at', 'submission_id', 'client_reference', 'form_version', 'response_document', 'snapshot', 'status', 'notification_status']);
      sheet.setFrozenRows(1);
    }
    const existing = sheet.getRange('B:B').createTextFinder(item.submissionId).matchEntireCell(true).findNext();
    if (existing) return json_({ ok: true, submissionId: item.submissionId, formType: item.formType });
    const root = PropertiesService.getScriptProperties().getProperty(item.testMode ? 'TESTER_UPLOAD_FOLDER_ID' : 'BRONAGH_UPLOAD_FOLDER_ID');
    if (!root) throw new Error('Follow-up destination not configured.');
    // Use the configured private client root, never a browser-supplied Drive ID.
    const label = (item.testMode ? 'TEST - ' : '') + 'Follow-up - ' + item.submissionId;
    const digest = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(item), Utilities.Charset.UTF_8));
    const found = Drive.Files.list({ q: "'" + root + "' in parents and name = '" + label + "' and trashed = false", fields: 'files(id,description)', pageSize: 10 });
    const folder = found.files && found.files[0] || Drive.Files.create({ name: label, description: digest, mimeType: 'application/vnd.google-apps.folder', parents: [root] });
    if (folder.description && folder.description !== digest) throw new Error('Submission ID already belongs to different answers.');
    const files = Drive.Files.list({ q: "'" + folder.id + "' in parents and trashed = false", fields: 'files(id,name)', pageSize: 100 }).files || [];
    let snapshot = files.find(file => file.name === 'follow-up-response.json');
    // Recover partial saves without creating duplicate files or mixing retry edits.
    if (!snapshot) {
      snapshot = Drive.Files.create({ name: 'follow-up-response.json', parents: [folder.id] }, Utilities.newBlob(JSON.stringify({ receivedAt: new Date().toISOString(), submission: item }, null, 2), 'text/plain', 'follow-up-response.json'));
    }
    const documentName = item.testMode ? 'TEST - Follow-up response' : 'Bronagh - Follow-up response';
    let doc = files.find(file => file.name === documentName);
    if (!doc) {
      const html = '<html><head><meta charset="utf-8"></head><body><h1>' + documentName + '</h1><p>Client: CL-2026-001<br>Submission: ' + item.submissionId + '</p><pre style="white-space:pre-wrap;font-family:Arial,sans-serif">' + html_(item.reviewText) + '</pre></body></html>';
      doc = Drive.Files.create({ name: documentName, mimeType: 'application/vnd.google-apps.document', parents: [folder.id] }, Utilities.newBlob(html, 'text/html', 'follow-up.html'));
    }
    sheet.appendRow([new Date(), item.submissionId, item.testMode ? 'TEST-CAREER-PARTNER' : item.clientReference, safeCell_(item.formVersion), driveUrl_(doc.id), driveUrl_(snapshot.id), 'Received', item.testMode ? 'Not sent (test)' : 'Pending']);
    if (!item.testMode) {
      try {
        MailApp.sendEmail({ to: ONBOARDING_CONFIG.ownerNotificationEmail, subject: "Bronagh's follow-up has arrived", body: 'The follow-up has been saved to the restricted client record.\nSubmission: ' + item.submissionId + '\nReadable response: ' + driveUrl_(doc.id), name: 'SABI Career Support' });
        sheet.getRange(sheet.getLastRow(), 8).setValue('Sent');
      } catch (error) { sheet.getRange(sheet.getLastRow(), 8).setValue('Failed'); }
    }
    return json_({ ok: true, submissionId: item.submissionId, formType: item.formType });
  } finally { lock.releaseLock(); }
}
