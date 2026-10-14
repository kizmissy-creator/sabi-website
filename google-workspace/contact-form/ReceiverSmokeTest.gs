/** Run only in a deliberately separate fictional-data spreadsheet/script. */
function runContactReceiverSmokeTest() {
  const properties = PropertiesService.getScriptProperties();
  const workbook = SpreadsheetApp.getActiveSpreadsheet();
  if (!workbook || !workbook.getName().startsWith('SABI RECEIVER TEST - ') ||
      properties.getProperty('CONTACT_TEST_MODE') !== 'true') {
    throw new Error('Use an isolated SABI RECEIVER TEST workbook with CONTACT_TEST_MODE=true.');
  }
  const origins = (properties.getProperty('CONTACT_ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean);
  const parentOrigin = properties.getProperty('CONTACT_TEST_PARENT_ORIGIN');
  if (!parentOrigin || origins.indexOf(parentOrigin) === -1) throw new Error('Configure the exact approved test-preview origin.');
  const version = properties.getProperty('CONTACT_PRIVACY_NOTICE_VERSION');
  if (version !== 'enquiries-draft-2026-10-14') throw new Error('Use the reviewed test notice version.');
  const sheet = ensureContactSheet_(workbook);
  const startingRows = sheet.getLastRow();
  const submissionId = Utilities.getUuid();
  const base = {
    submissionId: submissionId, attemptId: Utilities.getUuid(), parentOrigin: parentOrigin,
    privacyNoticeVersion: version, serviceArea: 'career', serviceInterest: 'Professional CV',
    name: 'EXAMPLE ONLY - receiver test', email: 'receiver-test@example.test',
    help: 'Fictional receiver test. No person or client record.', preferred_contact: 'email',
    formStartedAt: String(Date.now() - 5000), company: ''
  };
  function send(overrides) {
    const response = doPost({parameter: Object.assign({}, base, overrides || {})});
    return response.getContent();
  }
  function requireCheck(condition, description) {
    if (!condition) throw new Error('Receiver smoke test failed: ' + description);
  }
  requireCheck(send().includes('"result":"accepted"'), 'valid response');
  requireCheck(sheet.getLastRow() === startingRows + 1, 'exactly one row saved');
  requireCheck(send({attemptId: Utilities.getUuid()}).includes('"result":"accepted"'), 'duplicate retry acknowledged');
  requireCheck(sheet.getLastRow() === startingRows + 1, 'retry did not add a row');
  requireCheck(!send({submissionId: Utilities.getUuid(), email: 'not-an-email'}).includes('"result":"accepted"'), 'invalid email rejected');
  requireCheck(!send({submissionId: Utilities.getUuid(), privacyNoticeVersion: 'wrong-version'}).includes('"result":"accepted"'), 'unknown notice version rejected');
  requireCheck(!send({submissionId: Utilities.getUuid(), parentOrigin: 'https://unapproved.example.test'}).includes('"result":"accepted"'), 'unapproved origin rejected');
  requireCheck(sheet.getLastRow() === startingRows + 1, 'rejected input did not save');
  return {result: 'passed', checks: 8, addedFictionalRows: 1, workbook: workbook.getName(), note: 'Direct receiver tests only. Browser sandbox acknowledgement still needs deployed testing.'};
}
