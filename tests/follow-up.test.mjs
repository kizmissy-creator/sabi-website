import assert from 'node:assert/strict';
import { createHmac, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import submit from '../netlify/functions/follow-up-submit.mjs';

process.env.BRONAGH_ACCESS_SECRET = 'fictional-access-secret-for-unit-tests';
process.env.BRONAGH_SUBMISSION_SECRET = 'fictional-submission-secret-for-unit-tests';
process.env.BRONAGH_APPS_SCRIPT_ENDPOINT = 'https://receiver.invalid/exec';
process.env.BRONAGH_FOLLOW_UP_ENABLED = 'true';
const identity = `CL-2026-001.cs_unit.${Math.floor(Date.now()/1000)+60}`;
const cookie = Buffer.from(identity).toString('base64url') + '.' + createHmac('sha256', process.env.BRONAGH_ACCESS_SECRET).update(identity).digest('base64url');
const input = { clientReference: 'CL-2026-001', formType: 'career_partner_follow_up', formVersion: 'unit-v1', submissionId: '11111111-1111-4111-8111-111111111111', testMode: true, answers: { reviewNotes: 'FICTIONAL QA ONLY' }, reviewText: 'FICTIONAL QA ONLY', retainedAnswers: {} };
const request = (body=input, headers={}) => new Request('https://client.invalid/api/follow-up-submit', { method: 'POST', headers: { origin: 'https://client.invalid', cookie: 'sabi_client_access='+cookie, ...headers }, body: JSON.stringify(body) });
let calls=0, delivered;
globalThis.fetch = async (_, options) => { calls++; delivered = JSON.parse(options.body); return Response.json({ok:true, submissionId:input.submissionId, formType:input.formType}); };
assert.equal((await submit(request(input, {cookie:''}))).status,401);
assert.equal((await submit(request(input, {origin:'https://other.invalid'}))).status,403);
assert.equal((await submit(request({...input,clientReference:'OTHER'}))).status,400);
assert.equal(calls,0);
assert.equal((await submit(request())).status,200);
assert.equal(delivered.signature, createHmac('sha256',process.env.BRONAGH_SUBMISSION_SECRET).update('follow-up-v1\n'+delivered.payload).digest('base64url'));
delete process.env.BRONAGH_FOLLOW_UP_ENABLED;
assert.equal((await submit(request({...input,testMode:false}))).status,503);
globalThis.fetch = async () => Response.json({ok:true,submissionId:'wrong'});
assert.equal((await submit(request())).status,502);
globalThis.fetch = async () => { throw new Error('offline'); };
assert.equal((await submit(request())).status,502);

const sheets = new Map(), files=[], notifications=[];
const properties = { BRONAGH_SUBMISSION_SECRET:process.env.BRONAGH_SUBMISSION_SECRET, BRONAGH_UPLOAD_FOLDER_ID:'private-client-root',TESTER_UPLOAD_FOLDER_ID:'private-test-root' };
let locked=false, failDocument=false;
const workbook = { getSheetByName:name=>sheets.get(name), insertSheet(name) {
  const rows=[]; const sheet={rows,appendRow(row){rows.push(row)},setFrozenRows(){},getLastRow(){return rows.length},getRange(range,column){return {
    createTextFinder(id){return {matchEntireCell(){return this},findNext(){return rows.find(row=>row[1]===id)||null}}},
    setValue(value){rows[range-1][column-1]=value},
  }}}; sheets.set(name,sheet);return sheet;
}};
const context = {
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]})},
  SpreadsheetApp:{getActiveSpreadsheet:()=>workbook},
  LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true},releaseLock(){locked=false}})},
  Utilities:{Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},
    computeHmacSha256Signature:(text,secret)=>createHmac('sha256',secret).update(text).digest(),
    computeDigest:(_,text)=>createHash('sha256').update(text).digest(),
    base64EncodeWebSafe:value=>Buffer.from(value).toString('base64url'),newBlob:(text,type,name)=>({text,type,name})},
  Drive:{Files:{list({q}) { const parent=q.match(/^'([^']+)'/)[1];const name=q.match(/and name = '([^']+)'/);return {files:files.filter(f=>f.parents.includes(parent)&&(!name||f.name===name[1]))};},
    create(metadata,blob) {if(failDocument&&metadata.mimeType==='application/vnd.google-apps.document')throw new Error('document failed'); const file={...metadata,id:'file-'+files.length,blob};files.push(file);return file;}}},
  MailApp:{sendEmail:email=>notifications.push(email)},ONBOARDING_CONFIG:{ownerNotificationEmail:'owner@example.invalid'},
  constantTimeEqual_:(a,b)=>a===b,json_:x=>x,safeCell_:x=>x,driveUrl_:id=>'https://drive.invalid/'+id,
  html_:x=>x.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),
};
vm.createContext(context);
vm.runInContext(readFileSync(new URL('../google-workspace/bronagh-onboarding/FollowUp.gs',import.meta.url),'utf8'),context);
assert.throws(()=>context.receiveCareerFollowUp_({...delivered,signature:'wrong'}));
assert.equal(files.length,0);
failDocument=true;
assert.throws(()=>context.receiveCareerFollowUp_(delivered));
assert.equal(locked,false);
assert.equal(files.length,2);
failDocument=false;
assert.equal(context.receiveCareerFollowUp_(delivered).ok,true);
assert.equal(context.receiveCareerFollowUp_(delivered).ok,true);
assert.equal(files.length,3);
assert.equal(sheets.get('Follow-up tests').rows.length,2);
assert.equal(sheets.has('Bronagh Follow-up'),false);
assert.equal(files[0].parents[0],'private-test-root');
assert.equal(notifications.length,0);
assert.ok(!files[1].blob.text.includes('signature'));
assert.ok(files[2].blob.text.includes('FICTIONAL QA ONLY'));
console.log('PASS: client auth, origin, payload validation, signed delivery, production gate, mismatched receipt, offline failure, test isolation, partial-save recovery and duplicate prevention');
