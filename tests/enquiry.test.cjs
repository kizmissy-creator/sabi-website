const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createController } = require('../assets/enquiry.js');
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222', C='33333333-3333-4333-8333-333333333333';
function controller() {
  let next=0, timeout, sent=[], states=[];
  const c=createController({enabled:true, uuid:()=>[A,B,C][next++], onState:s=>states.push(s), submit:p=>sent.push(p),setTimeout:fn=>{timeout=fn;return 1},clearTimeout:()=>{timeout=null}});
  const ack=(result,overrides={})=>({origin:'https://test-script.googleusercontent.com',source:{},data:{type:'sabi-enquiry-result',version:1,...sent.at(-1),result},...overrides});
  return {c,sent,states,ack,expire:()=>timeout()};
}
test('only a correlated trusted acknowledgement confirms success',()=>{
 const {c,sent,ack}=controller();
 assert.equal(c.start(),true);assert.equal(c.start(),false);assert.equal(sent.length,1);
 assert.equal(c.receive(ack('accepted',{origin:'https://evil.example'})),false);
 const wrong=ack('accepted');wrong.data.attemptId=C;assert.equal(c.receive(wrong),false);
 assert.equal(c.receive(ack('accepted',{origin:'https://script.googleusercontent.com.evil.example'})),false);
 assert.equal(c.getState(),'sending');
 assert.equal(c.receive(ack('accepted')),true);assert.equal(c.getState(),'accepted');assert.equal(c.start(),false);
});
test('timeout retries preserve submission ID but reject late old attempts',()=>{
 const {c,sent,ack,expire}=controller();c.start();const old=ack('accepted');expire();
 assert.equal(c.getState(),'unconfirmed');assert.equal(c.receive(old),false);c.start();
 assert.equal(sent[0].submissionId,sent[1].submissionId);assert.notEqual(sent[0].attemptId,sent[1].attemptId);
 assert.equal(c.receive(old),false);assert.equal(c.receive(ack('accepted')),true);
});
test('rejection and uncertain failures never become accepted',()=>{
 for (const result of ['rejected','unconfirmed']) {const {c,ack}=controller();c.start();c.receive(ack(result));assert.equal(c.getState(),result);assert.equal(c.start(),true);}
});
test('preview cannot submit',()=>{
 let submitted=false;const c=createController({enabled:false,uuid:()=>A,onState:()=>{},submit:()=>submitted=true});assert.equal(c.start(),false);assert.equal(submitted,false);
});
function receiver({failWrite=false,testMode=false,testName="SABI RECEIVER TEST - fixture"}={}) {
 const rows=[],calls={rate:0},cache={};
 const sheet={getLastRow:()=>rows.length,appendRow:row=>{if(failWrite&&rows.length)throw Error('write unavailable');rows.push(row)},setFrozenRows:()=>{},getRange:(row,col)=>({getValue:()=>rows[0]?.[7]||'',setValue:value=>{rows[0][7]=value},createTextFinder:id=>({matchEntireCell:()=>({findNext:()=>rows.find(r=>r[1]===id)})})})};
 const ctx={console:{error:()=>{}},Date,PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='CONTACT_PRIVACY_NOTICE_VERSION'?'enquiries-draft-2026-10-14':key==='CONTACT_TEST_MODE'?String(testMode):'https://sabi.example'})},LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},SpreadsheetApp:{getActiveSpreadsheet:()=>({getName:()=>testName,getSheetByName:()=>sheet})},Utilities:{getUuid:()=>require('node:crypto').randomUUID(),computeDigest:()=>[1],DigestAlgorithm:{SHA_256:1},base64EncodeWebSafe:()=> 'hash'},CacheService:{getScriptCache:()=>({get:k=>cache[k],put:(k,v)=>{calls.rate++;cache[k]=v}})},HtmlService:{XFrameOptionsMode:{ALLOWALL:1},createHtmlOutput:html=>({html,getContent(){return html},setXFrameOptionsMode(){return this}})}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('google-workspace/contact-form/Code.gs','utf8'),ctx);
 const submit=(extra={})=>ctx.doPost({parameter:{submissionId:A,attemptId:B,parentOrigin:'https://sabi.example',serviceArea:'career',serviceInterest:'Professional CV',name:'Example Client',email:'client@example.test',help:'Brief fictional enquiry',formStartedAt:String(Date.now()-4000),privacyNoticeVersion:'enquiries-draft-2026-10-14',...extra}}).html;
 vm.runInContext(fs.readFileSync('google-workspace/contact-form/ReceiverSmokeTest.gs','utf8'),ctx);
 return {submit,rows,calls,runSmoke:()=>ctx.runContactReceiverSmokeTest()};
}
test('receiver stores once and acknowledges duplicate without rate-limit charge',()=>{
 const {submit,rows,calls}=receiver();assert.match(submit(),/"result":"accepted"/);assert.match(submit({attemptId:C}),/"result":"accepted"/);assert.equal(rows.length,2);assert.equal(calls.rate,1);assert.match(rows[1][5],/Professional CV/);assert.equal(rows[1][7],'enquiries-draft-2026-10-14');
});
test('receiver rejects invalid input, honeypot and unapproved origins without saving',()=>{
 for (const extra of [{email:'bad'},{privacyNoticeVersion:''},{privacyNoticeVersion:'unknown-version'},{company:'bot'},{serviceArea:'advocacy'},{parentOrigin:'https://evil.example'}]) {const {submit,rows}=receiver();assert.doesNotMatch(submit(extra),/"result":"accepted"/);assert.equal(rows.length,0);}
});
test('storage failure is unconfirmed and response contains no client answers',()=>{
 const {submit}=receiver({failWrite:true});const html=submit();assert.match(html,/"result":"unconfirmed"/);assert.doesNotMatch(html,/Example Client|client@example|Brief fictional/);
});

test('isolated receiver runner completes checks and leaves only one fictional record',()=>{
 const {runSmoke,rows}=receiver({testMode:true});const result=runSmoke();assert.equal(result.result,'passed');assert.equal(result.checks,8);assert.equal(rows.length,2);
});
test('receiver runner refuses ordinary workbooks or missing explicit test mode',()=>{
 for(const options of [{testMode:false},{testMode:true,testName:'Actual enquiries'}]){const {runSmoke,rows}=receiver(options);assert.throws(runSmoke,/isolated/);assert.equal(rows.length,0);}
});
