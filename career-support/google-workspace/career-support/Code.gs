/** @OnlyCurrentDoc */

const CAREER_DEV_CONFIG = Object.freeze({
  developmentMode: true,
  spreadsheetId: '1I0EWd11MLTFOCLQjnIkLPTTME9FXkdordQ78uQZ-5iE',
  formVersion: 'cs-form-dev-2026-08',
  ageWordingVersion: 'age-route-2026-08-04',
  verificationMinutes: 10,
  returnTokenDays: 30,
  maximumVerificationAttempts: 5,
  maximumBodyLength: 15000,
  allowedServices: [
    'professional_cv',
    'career_change',
    'career_partner',
    'career_partner_plus',
    'starter_cv'
  ],
  allowedAgeBands: ['16-17', '18-plus'],
  sheets: {
    serviceConfig: 'Service Config',
    drafts: 'Drafts',
    verification: 'Verification',
    audit: 'Audit Log'
  }
});

function configureCareerSupportDevelopment() {
  if (!CAREER_DEV_CONFIG.developmentMode) {
    throw new Error('This setup function is for fictional development only.');
  }

  const spreadsheet = SpreadsheetApp.openById(CAREER_DEV_CONFIG.spreadsheetId);
  ensureDevelopmentSheets_(spreadsheet);

  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('CAREER_DEV_PEPPER')) {
    properties.setProperty('CAREER_DEV_PEPPER', createOpaqueToken_());
  }

  properties.setProperty('CAREER_DEV_SPREADSHEET_ID', CAREER_DEV_CONFIG.spreadsheetId);
  return 'Career Support fictional-development receiver configured.';
}

function doPost(e) {
  try {
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '';
    if (rawBody.length > CAREER_DEV_CONFIG.maximumBodyLength) {
      throw new Error('Request too large.');
    }

    const input = JSON.parse(rawBody || '{}');
    requireFictionalRequest_(input);

    let result;
    switch (String(input.action || '')) {
      case 'requestVerification':
        result = requestVerification_(input);
        break;
      case 'verifyCode':
        result = verifyCode_(input);
        break;
      case 'saveDraft':
        result = saveDraft_(input);
        break;
      case 'loadDraft':
        result = loadDraft_(input);
        break;
      default:
        throw new Error('Unknown development action.');
    }

    return jsonResponse_(Object.assign({ ok: true }, result));
  } catch (error) {
    console.error('Career Support development request rejected: ' + error.message);
    return jsonResponse_({ ok: false, message: safePublicError_(error) });
  }
}

function requestVerification_(input) {
  const email = normaliseFictionalEmail_(input.email);
  const serviceCode = requireAllowedService_(input.serviceCode);
  const ageBand = requireAllowedAgeBand_(input.ageBand);
  enforceRateLimit_('verification', email, 5, 600);

  const spreadsheet = getDevelopmentSpreadsheet_();
  const verificationSheet = spreadsheet.getSheetByName(CAREER_DEV_CONFIG.sheets.verification);
  const auditSheet = spreadsheet.getSheetByName(CAREER_DEV_CONFIG.sheets.audit);
  const verificationId = 'verify-' + createOpaqueToken_();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CAREER_DEV_CONFIG.verificationMinutes * 60 * 1000);

  verificationSheet.appendRow([
    verificationId,
    safeCell_(email),
    hashValue_(verificationId + ':' + code),
    'create_or_return_draft',
    now,
    expiresAt,
    0,
    '',
    'pending',
    '',
    true,
    'Fictional development record'
  ]);

  appendAudit_(auditSheet, {
    event: 'verification_requested',
    draftId: '',
    serviceCode,
    ageBand,
    actor: 'fictional-client',
    route: 'career-support-development',
    result: 'created',
    testCase: '',
    notes: 'No real email sent. Development code returned to fictional test page.'
  });

  return {
    verificationId,
    developmentCode: code,
    expiresAt: expiresAt.toISOString(),
    testOnly: true
  };
}

function verifyCode_(input) {
  const verificationId = cleanText_(input.verificationId, 120);
  const code = cleanText_(input.code, 6);
  const serviceCode = requireAllowedService_(input.serviceCode);
  const ageBand = requireAllowedAgeBand_(input.ageBand);
  if (!/^\d{6}$/.test(code)) throw new Error('Invalid fictional verification code.');

  const spreadsheet = getDevelopmentSpreadsheet_();
  const verificationSheet = spreadsheet.getSheetByName(CAREER_DEV_CONFIG.sheets.verification);
  const draftsSheet = spreadsheet.getSheetByName(CAREER_DEV_CONFIG.sheets.drafts);
  const auditSheet = spreadsheet.getSheetByName(CAREER_DEV_CONFIG.sheets.audit);
  const row = findRowByExactValue_(verificationSheet, 1, verificationId);
  if (!row) throw new Error('Fictional verification request not found.');

  const values = verificationSheet.getRange(row, 1, 1, 12).getValues()[0];
  const email = String(values[1] || '').toLowerCase();
  const storedHash = String(values[2] || '');
  const expiresAt = new Date(values[5]);
  const attempts = Number(values[6] || 0);
  const status = String(values[8] || '');

  if (status !== 'pending') throw new Error('Fictional verification request is no longer active.');
  if (attempts >= CAREER_DEV_CONFIG.maximumVerificationAttempts) throw new Error('Too many fictional verification attempts.');
  if (Date.now() > expiresAt.getTime()) {
    verificationSheet.getRange(row, 9).setValue('expired');
    throw new Error('Fictional verification code expired.');
  }

  verificationSheet.getRange(row, 7).setValue(attempts + 1);
  if (!constantTimeEqual_(storedHash, hashValue_(verificationId + ':' + code))) {
    appendAudit_(auditSheet, {
      event: 'verification_failed', serviceCode, ageBand, actor: 'fictional-client',
      route: 'career-support-development', result: 'rejected', notes: 'Incorrect fictional code.'
    });
    throw new Error('Fictional verification code is incorrect.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    let draftRow = findExistingDraftRow_(draftsSheet, email, serviceCode);
    let draftId;
    let returnToken;
    let answers = {};

    if (draftRow) {
      const draftValues = draftsSheet.getRange(draftRow, 1, 1, 16).getValues()[0];
      draftId = String(draftValues[0]);
      answers = parseJsonObject_(draftValues[13]);
      returnToken = rotateReturnToken_(draftsSheet, draftRow);
      draftsSheet.getRange(draftRow, 3).setValue(ageBand);
      draftsSheet.getRange(draftRow, 8).setValue(new Date());
    } else {
      draftId = 'draft-' + createOpaqueToken_();
      returnToken = createOpaqueToken_();
      const now = new Date();
      const deletionDue = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      draftsSheet.appendRow([
        draftId,
        safeCell_(email),
        ageBand,
        serviceCode,
        'draft_verified',
        'draft',
        now,
        now,
        hashValue_(draftId + ':' + returnToken),
        CAREER_DEV_CONFIG.formVersion,
        'working-draft-2026-08-01',
        deletionDue,
        true,
        '{}',
        '[]',
        'Fictional development record'
      ]);
      draftRow = draftsSheet.getLastRow();
    }

    verificationSheet.getRange(row, 8).setValue(new Date());
    verificationSheet.getRange(row, 9).setValue('used');
    verificationSheet.getRange(row, 10).setValue(draftId);

    appendAudit_(auditSheet, {
      event: 'verification_succeeded', draftId, serviceCode, ageBand,
      actor: 'fictional-client', route: 'career-support-development', result: 'draft_opened'
    });

    return { draftId, returnToken, email, serviceCode, ageBand, answers, testOnly: true };
  } finally {
    lock.releaseLock();
  }
}

function saveDraft_(input) {
  const draftId = cleanText_(input.draftId, 140);
  const returnToken = cleanText_(input.returnToken, 220);
  const serviceCode = requireAllowedService_(input.serviceCode);
  const ageBand = requireAllowedAgeBand_(input.ageBand);
  const currentSection = cleanText_(input.currentSection || 'draft', 60);
  const answers = sanitiseAnswers_(input.answers);

  const spreadsheet = getDevelopmentSpreadsheet_();
  const draftsSheet = spreadsheet.getSheetByName(CAREER_DEV_CONFIG.sheets.drafts);
  const auditSheet = spreadsheet.getSheetByName(CAREER_DEV_CONFIG.sheets.audit);
  const row = authenticateDraft_(draftsSheet, draftId, returnToken);
  const storedService = String(draftsSheet.getRange(row, 4).getValue());
  if (storedService !== serviceCode) throw new Error('Service code does not match fictional draft.');

  const now = new Date();
  draftsSheet.getRange(row, 3).setValue(ageBand);
  draftsSheet.getRange(row, 5).setValue('draft_incomplete');
  draftsSheet.getRange(row, 6).setValue(currentSection);
  draftsSheet.getRange(row, 8).setValue(now);
  draftsSheet.getRange(row, 14).setValue(JSON.stringify(answers));
  draftsSheet.getRange(row, 12).setValue(new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000));

  appendAudit_(auditSheet, {
    event: 'draft_saved', draftId, serviceCode, ageBand,
    actor: 'fictional-client', route: 'career-support-development', result: 'saved'
  });

  return { savedAt: now.toISOString(), testOnly: true };
}

function loadDraft_(input) {
  const draftId = cleanText_(input.draftId, 140);
  const returnToken = cleanText_(input.returnToken, 220);
  const requestedService = requireAllowedService_(input.serviceCode);

  const spreadsheet = getDevelopmentSpreadsheet_();
  const draftsSheet = spreadsheet.getSheetByName(CAREER_DEV_CONFIG.sheets.drafts);
  const auditSheet = spreadsheet.getSheetByName(CAREER_DEV_CONFIG.sheets.audit);
  const row = authenticateDraft_(draftsSheet, draftId, returnToken);
  const values = draftsSheet.getRange(row, 1, 1, 16).getValues()[0];
  const serviceCode = String(values[3]);
  if (serviceCode !== requestedService) throw new Error('Service code does not match fictional draft.');

  draftsSheet.getRange(row, 8).setValue(new Date());
  appendAudit_(auditSheet, {
    event: 'draft_returned', draftId, serviceCode, ageBand: String(values[2]),
    actor: 'fictional-client', route: 'career-support-development', result: 'opened'
  });

  return {
    draftId,
    email: String(values[1]),
    ageBand: String(values[2]),
    serviceCode,
    state: String(values[4]),
    currentSection: String(values[5]),
    answers: parseJsonObject_(values[13]),
    testOnly: true
  };
}

function requireFictionalRequest_(input) {
  if (!CAREER_DEV_CONFIG.developmentMode || input.testOnly !== true) {
    throw new Error('Live information is not accepted by this development receiver.');
  }
  if (String(input.formVersion || '') !== CAREER_DEV_CONFIG.formVersion) {
    throw new Error('Unknown development form version.');
  }
}

function normaliseFictionalEmail_(value) {
  const email = cleanText_(value, 254).toLowerCase();
  if (!/^[^\s@]+@example\.com$/.test(email)) {
    throw new Error('Use a fictional @example.com email address only.');
  }
  return email;
}

function requireAllowedService_(value) {
  const serviceCode = cleanText_(value, 80);
  if (CAREER_DEV_CONFIG.allowedServices.indexOf(serviceCode) === -1) {
    throw new Error('Unknown Career Support service code.');
  }
  return serviceCode;
}

function requireAllowedAgeBand_(value) {
  const ageBand = cleanText_(value, 20);
  if (CAREER_DEV_CONFIG.allowedAgeBands.indexOf(ageBand) === -1) {
    throw new Error('This development receiver accepts only the 16 or 17 and 18 or over routes.');
  }
  return ageBand;
}

function sanitiseAnswers_(answers) {
  const input = answers && typeof answers === 'object' ? answers : {};
  return {
    preferredName: cleanText_(input.preferredName, 60),
    testNote: cleanText_(input.testNote, 500)
  };
}

function getDevelopmentSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('CAREER_DEV_SPREADSHEET_ID') || CAREER_DEV_CONFIG.spreadsheetId;
  return SpreadsheetApp.openById(spreadsheetId);
}

function ensureDevelopmentSheets_(spreadsheet) {
  Object.values(CAREER_DEV_CONFIG.sheets).forEach(function (name) {
    if (!spreadsheet.getSheetByName(name)) throw new Error('Missing required development sheet: ' + name);
  });
}

function findRowByExactValue_(sheet, column, value) {
  if (sheet.getLastRow() < 4) return 0;
  const match = sheet.getRange(4, column, sheet.getLastRow() - 3, 1)
    .createTextFinder(String(value))
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function findExistingDraftRow_(sheet, email, serviceCode) {
  if (sheet.getLastRow() < 4) return 0;
  const values = sheet.getRange(4, 1, sheet.getLastRow() - 3, 16).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][1]).toLowerCase() === email && String(values[index][3]) === serviceCode && values[index][12] === true) {
      return index + 4;
    }
  }
  return 0;
}

function authenticateDraft_(sheet, draftId, returnToken) {
  const row = findRowByExactValue_(sheet, 1, draftId);
  if (!row) throw new Error('Fictional draft not found.');
  const storedHash = String(sheet.getRange(row, 9).getValue());
  if (!constantTimeEqual_(storedHash, hashValue_(draftId + ':' + returnToken))) {
    throw new Error('Fictional return link is invalid.');
  }
  if (sheet.getRange(row, 13).getValue() !== true) {
    throw new Error('This receiver does not accept live drafts.');
  }
  return row;
}

function rotateReturnToken_(sheet, row) {
  const draftId = String(sheet.getRange(row, 1).getValue());
  const token = createOpaqueToken_();
  sheet.getRange(row, 9).setValue(hashValue_(draftId + ':' + token));
  return token;
}

function appendAudit_(sheet, event) {
  sheet.appendRow([
    new Date(),
    safeCell_(event.event || ''),
    safeCell_(event.draftId || ''),
    safeCell_(event.serviceCode || ''),
    safeCell_(event.ageBand || ''),
    safeCell_(event.actor || ''),
    safeCell_(event.route || ''),
    safeCell_(event.result || ''),
    safeCell_(event.testCase || ''),
    CAREER_DEV_CONFIG.formVersion,
    true,
    safeCell_(event.notes || '')
  ]);
}

function parseJsonObject_(value) {
  try {
    const parsed = JSON.parse(String(value || '{}'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function createOpaqueToken_() {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid() + ':' + Date.now() + ':' + Math.random()
  );
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function hashValue_(value) {
  const pepper = PropertiesService.getScriptProperties().getProperty('CAREER_DEV_PEPPER');
  if (!pepper) throw new Error('Development receiver has not been configured.');
  const digest = Utilities.computeHmacSha256Signature(String(value), pepper);
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, '');
}

function constantTimeEqual_(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

function enforceRateLimit_(type, value, maximum, seconds) {
  const key = 'career-dev:' + type + ':' + hashValue_(value).slice(0, 28);
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get(key) || 0);
  if (count >= maximum) throw new Error('Too many fictional requests. Try again later.');
  cache.put(key, String(count + 1), seconds);
}

function cleanText_(value, maximumLength) {
  return String(value == null ? '' : value).replace(/\u0000/g, '').trim().slice(0, maximumLength);
}

function safeCell_(value) {
  const text = cleanText_(value, 2000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function safePublicError_(error) {
  const message = String(error && error.message || 'The fictional development request could not be completed.');
  const allowed = [
    'Request too large.',
    'Unknown development action.',
    'Live information is not accepted by this development receiver.',
    'Unknown development form version.',
    'Use a fictional @example.com email address only.',
    'Unknown Career Support service code.',
    'This development receiver accepts only the 16 or 17 and 18 or over routes.',
    'Invalid fictional verification code.',
    'Fictional verification request not found.',
    'Fictional verification request is no longer active.',
    'Too many fictional verification attempts.',
    'Fictional verification code expired.',
    'Fictional verification code is incorrect.',
    'Service code does not match fictional draft.',
    'Fictional draft not found.',
    'Fictional return link is invalid.',
    'This receiver does not accept live drafts.',
    'Too many fictional requests. Try again later.',
    'Development receiver has not been configured.'
  ];
  return allowed.indexOf(message) >= 0 ? message : 'The fictional development request could not be completed.';
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
