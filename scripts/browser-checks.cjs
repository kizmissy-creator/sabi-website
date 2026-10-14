// Browser checks use only a local site and mocked Google responses.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return}
 try {if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(fs.readFileSync(file));
 }catch{res.writeHead(404);res.end('Missing')}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try {
 const context=await browser.newContext();
 // No external website or production receiver may be contacted.
 await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base+'/'))return route.continue();return route.abort();});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const externalRequests=[];page.on('request',r=>{if(!r.url().startsWith(base+'/'))externalRequests.push(r.url());});
 for(const width of [320,390,768,1280]) {
   await page.setViewportSize({width,height:850});await page.goto(base+'/');
   assert.equal(await page.locator('h1').count(),1);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'homepage overflow at '+width);
   await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Skip to main content');
   await page.keyboard.press('Enter');assert.equal(await page.locator(':focus').getAttribute('id'),'main-content');
   if(width<=680){
     const toggle=page.locator('#menu-toggle'),nav=page.locator('#main-navigation');
     assert.equal(await nav.isVisible(),false);await toggle.click();assert.equal(await nav.isVisible(),true);
     assert.equal(await toggle.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');
     assert.equal(await nav.isVisible(),false);assert.equal(await page.locator(':focus').getAttribute('id'),'menu-toggle');
     await toggle.click();await nav.getByRole('link',{name:'Services',exact:true}).click();
     assert.equal(await nav.isVisible(),false);assert.equal(new URL(page.url()).hash,'#services');
   }else{assert.equal(await page.locator('#main-navigation').isVisible(),true);}
   await page.locator('.questions summary').first().click();assert.equal(await page.locator('details').first().getAttribute('open'),'');
   await page.locator('.questions summary').first().click();
   for(const href of ['/career/','/admin-systems/','/writing/']){
     await page.locator('.choice-link[href="'+href+'"]').click();assert.equal(new URL(page.url()).pathname,href);await page.goBack();
   }
   const disclosure=page.locator('#enquiry-preview');
   assert.equal(await disclosure.getAttribute('open'),null);
   assert.equal(await page.locator('#sabi-enquiry').isVisible(),false);
   await disclosure.locator('summary').click();assert.equal(await page.locator('#sabi-enquiry').isVisible(),true);
   assert.equal(await page.locator('button[type=submit]').isDisabled(),true);
   await disclosure.locator('summary').click();
   await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});
   if(process.env.EVIDENCE_DIR){fs.mkdirSync(process.env.EVIDENCE_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.EVIDENCE_DIR,'homepage-'+width+'.png'),fullPage:true});}
 }
 // Resize while the menu is open: desktop navigation must remain usable.
 await page.setViewportSize({width:390,height:850});await page.goto(base+'/');await page.locator('#menu-toggle').click();
 await page.setViewportSize({width:1280,height:850});assert.equal(await page.locator('#main-navigation').isVisible(),true);
 // Reflow with larger text, preserving readable controls and full content.
 await page.setViewportSize({width:390,height:850});await page.goto(base+'/');
 await page.addStyleTag({content:'body.home-page{font-size:200%} .home-page p,.home-page a,.home-page label,.home-page summary{font-size:1.1em!important}'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'larger-text homepage overflow');
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:850}});
 await noJS.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 const plain=await noJS.newPage();await plain.goto(base+'/');assert.equal(await plain.locator('#main-navigation').isVisible(),true);
 await plain.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Services',exact:true}).click();
 assert.equal(new URL(plain.url()).hash,'#services');await noJS.close();
 for(const width of [390,1280]) {
 await page.setViewportSize({width,height:850});
 for(const route of ['/career/','/admin-systems/','/writing/','/writing/clarity-edit/','/writing/case-studies/','/writing/reports/','/writing/articles/','/privacy/']) {
 await page.goto(base+route);assert.equal(await page.locator('h1').count(),1);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+route+' at '+width);
 await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Skip to main content');
 await page.evaluate(()=>document.activeElement.blur());
 if(process.env.EVIDENCE_DIR){fs.mkdirSync(process.env.EVIDENCE_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.EVIDENCE_DIR,route.replaceAll('/','_')+width+'.png'),fullPage:true});}
 }
 }
 assert.deepEqual(externalRequests,[],'public pages must load entirely local assets');
 await page.goto(base+'/?service=writing-reports#contact-form');
 assert.equal(await page.locator('#enquiry-preview').getAttribute('open'),'');
 assert.equal(await page.locator('#sabi-enquiry').isVisible(),true);
 assert.equal(await page.locator('#service-area').inputValue(),'writing');assert.equal(await page.locator('#service-interest').inputValue(),'Reports & Briefings');
 assert.equal(await page.locator('button[type=submit]').isDisabled(),true);
 // Enable only the served in-memory HTML copy, never the tracked preview.
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('data-enabled="false" data-endpoint=""','data-enabled="true" data-endpoint="https://script.google.com/macros/s/fixture/exec"');
 await context.route(base+'/',route=>route.fulfill({contentType:'text/html',body:html}));
 let result='accepted', requests=0;
 await context.route('https://script.google.com/macros/s/fixture/exec',async route=>{
 requests++;const p=new URLSearchParams(route.request().postData());
 assert.equal(p.get('privacyNoticeVersion'),'enquiries-draft-2026-10-14');assert.equal(p.get('name'),'Example Client');assert.equal(p.get('help'),'Brief fictional enquiry');
 const data={type:'sabi-enquiry-result',version:1,submissionId:p.get('submissionId'),attemptId:p.get('attemptId'),result};
 await route.fulfill({contentType:'text/html',body:'<script>window.top.postMessage('+JSON.stringify(data)+','+JSON.stringify(base)+');</script>'});
 });
 async function fill(){await page.goto(base+'/');await page.locator('#name').fill('Example Client');await page.locator('#email').fill('client@example.test');await page.locator('#help').fill('Brief fictional enquiry');assert.equal(await page.locator('[name=privacyNoticeVersion]').inputValue(),'enquiries-draft-2026-10-14');assert.equal(await page.locator('[name=privacyAcknowledged]').count(),0);}
 await fill();await page.locator('button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#enquiry-status').textContent.includes('has been received'));assert.equal(requests,1);
 result='rejected';await fill();await page.locator('button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#enquiry-status').textContent.includes('not accepted'));assert.equal(await page.locator('#name').isDisabled(),false);assert.equal(await page.locator('button[type=submit]').isDisabled(),false);
 result='unconfirmed';await fill();await page.locator('button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#enquiry-status').textContent.includes('could not confirm'));assert.equal(await page.locator('#name').isDisabled(),true);const id=await page.locator('#submission-id').inputValue();result='accepted';await page.locator('button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#enquiry-status').textContent.includes('has been received'));assert.equal(await page.locator('#submission-id').inputValue(),id);
 assert.deepEqual(errors,[]);
 console.log('Browser checks passed: homepage at four widths, menu/FAQ/service links, collapsed preview form and service-specific expansion, larger-text reflow, no-JS navigation, local-only assets, eight service/privacy pages at two widths, keyboard skip links, service routing, preview gate, accepted/rejected/unconfirmed acknowledgements and retry. All submissions mocked.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
