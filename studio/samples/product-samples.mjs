import { catalogue } from './catalogue.mjs';
let token = new URLSearchParams(location.hash.slice(1)).get('invite') || '';
try {
  if (token) sessionStorage.setItem('sabi-sample-invite', token);
  else token = sessionStorage.getItem('sabi-sample-invite') || '';
} catch { /* An invitation still works if browser session storage is disabled. */ }
if (token || location.hash === '#samples') initialise();

async function initialise() {
  const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = 'samples/product-samples.css'; document.head.append(style);
  const productDialog = document.querySelector('#product-dialog');
  const add = document.createElement('button'); add.type = 'button'; add.className = 'button sample-add'; add.textContent = token ? 'Checking sample availability…' : 'Enter your sample code'; add.disabled = !!token;
  productDialog.querySelector('.close-secondary').before(add);
  let state, product, requestDialog, form, size, review, pending, codeDialog, submitting = false, opening = false;
  const help = document.createElement('p'); help.className = 'sample-help'; help.setAttribute('role', 'status'); add.after(help);
  async function api(action, data = {}, credential = token) {
    let response;
    try {
      response = await fetch('/.netlify/functions/sample-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, action, token: credential }), cache: 'no-store', signal: AbortSignal.timeout(20000) });
    } catch { throw new Error('We couldn’t confirm the request. Please try again; your details are still here.'); }
    let value;
    try { value = await response.json(); } catch { throw new Error('Sample requests are temporarily unavailable. Please try again.'); }
    if (!response.ok) { const error = new Error(value.error || 'Please try again in a moment.'); error.status = response.status; throw error; }
    return value;
  }
  function update() {
    if (!state || !product) return;
    help.textContent = state.test ? 'Test mode — this won’t reserve a real sample.' : '';
    if (state.used) {
      add.textContent = state.status === 'cancelled' ? 'Sample request cancelled' : 'Your sample is already requested'; add.disabled = true;
      help.textContent = `Reference ${state.reference}. Contact Sam to make a change.`;
    } else if (state.claimed.includes(product.id)) {
      add.textContent = 'Sample already claimed'; add.disabled = true;
    } else { add.textContent = 'Add sample'; add.disabled = false; }
  }
  async function check() {
    if (!token) return;
    try { state = await api('availability'); update(); }
    catch (error) {
      if (error.status === 403) { token = ''; state = null; try { sessionStorage.removeItem('sabi-sample-invite'); } catch {} }
      add.disabled = false; add.textContent = token ? 'Check sample availability' : 'Enter your sample code'; help.textContent = error.message;
    }
  }
  async function enterCode() {
    if (!codeDialog) {
      const response = await fetch('samples/code.html');
      if (!response.ok) throw new Error('The code form couldn’t load. Please try again.');
      const template = document.createElement('template'); template.innerHTML = await response.text(); document.body.append(template.content);
      codeDialog = document.querySelector('#sample-code-dialog');
      codeDialog.querySelector('.sample-close').addEventListener('click', () => codeDialog.close());
      codeDialog.addEventListener('close', () => { if (product) { productDialog.showModal(); add.focus(); } });
      codeDialog.querySelector('form').addEventListener('submit', async event => {
        event.preventDefault();
        const codeForm = event.currentTarget, button = codeForm.querySelector('button[type="submit"]');
        if (button.disabled || !codeForm.reportValidity()) return;
        const candidate = codeForm.elements.code.value.trim();
        button.disabled = true;
        const status = codeForm.querySelector('[role="status"]'); status.textContent = 'Checking your code…';
        try {
          const result = await api('availability', {}, candidate);
          if (result.used) { status.textContent = `This code has already been used. Reference ${result.reference}. Contact Sam to change your request.`; return; }
          token = candidate; state = result;
          try { sessionStorage.setItem('sabi-sample-invite', token); } catch {}
          add.textContent = 'Add sample'; add.disabled = false; update(); status.textContent = ''; codeDialog.close();
        } catch (error) { status.textContent = error.message; }
        finally { button.disabled = false; }
      });
    }
    if (productDialog.open) productDialog.close();
    codeDialog.showModal(); codeDialog.querySelector('input').focus();
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-product]');
    if (!trigger) return;
    product = catalogue.find(item => item.id === trigger.dataset.product);
    update(); check();
  });
  async function prepareForm() {
    if (requestDialog) return;
    const response = await fetch('samples/form.html');
    if (!response.ok) throw new Error('The sample form couldn’t load. Please try again.');
    const template = document.createElement('template'); template.innerHTML = await response.text(); document.body.append(template.content);
    requestDialog = document.querySelector('#sample-dialog');
    form = requestDialog.querySelector('form'); size = form.elements.size;
    review = requestDialog.querySelector('#sample-review');
    if (state.test) {
      const note = document.createElement('p'); note.className = 'sample-terms'; note.textContent = 'Test mode — choose any item. This won’t reserve a real sample or create a supplier order.';
      requestDialog.querySelector('#sample-title').after(note);
      requestDialog.querySelector('#sample-success > p:last-of-type').textContent = 'This was a test request only. Your friends’ sample stock is unchanged, and nothing will be ordered.';
    }
    function close() { if (!submitting) requestDialog.close(); }
    requestDialog.addEventListener('cancel', event => { if (submitting) event.preventDefault(); });
    requestDialog.querySelector('.sample-close').addEventListener('click', close);
    requestDialog.querySelector('.sample-done').addEventListener('click', close);
    requestDialog.addEventListener('close', () => {
      if (state?.used) document.querySelector(`[data-product="${product.id}"]`)?.focus();
      else { productDialog.showModal(); add.focus(); }
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting || !form.reportValidity()) return;
      pending = Object.fromEntries(new FormData(form)); pending.consent = form.elements.consent.checked;
      review.querySelector('[data-review="size"]').textContent = pending.size;
      review.querySelector('[data-review="contact"]').textContent = `${pending.name}\n${pending.email}`;
      review.querySelector('[data-review="address"]').textContent = ['address1','address2','city','region','postcode','country'].map(key => pending[key]).filter(Boolean).join('\n');
      review.querySelector('[data-review="notes"]').textContent = pending.notes || 'None';
      review.querySelector('[role="status"]').textContent = '';
      form.hidden = true; review.hidden = false; review.focus();
    });
    review.querySelector('.sample-edit').addEventListener('click', () => {
      if (submitting) return;
      review.hidden = true; form.hidden = false; size.focus();
    });
    review.querySelector('.sample-confirm').addEventListener('click', async () => {
      if (submitting || !pending) return;
      submitting = true;
      const submit = review.querySelector('.sample-confirm'); submit.disabled = true;
      review.querySelector('.sample-edit').disabled = true;
      const status = review.querySelector('[role="status"]'); status.textContent = 'Confirming your free sample…';
      try { const saved = await api('reserve', pending); showSuccess(saved.reference); }
      catch (error) {
        status.textContent = error.message;
        try { state = await api('availability'); update(); if (state.used && state.status !== 'cancelled') showSuccess(state.reference); }
        catch { /* Keep entered details available for a retry. */ }
      } finally { submitting = false; submit.disabled = false; review.querySelector('.sample-edit').disabled = false; }
    });
  }
  function showSuccess(reference) {
    state = { ...state, used: true, reference };
    form.reset(); pending = null; form.hidden = true; review.hidden = true; update();
    const success = requestDialog.querySelector('#sample-success'); success.hidden = false;
    requestDialog.querySelector('#sample-confirmation').textContent = `${state.test ? 'Your test reference' : 'Your reference'} is ${reference}. There is nothing for you to pay.`;
    success.focus();
  }
  add.addEventListener('click', async () => {
    if (!product || opening) return;
    if (!token) { try { await enterCode(); } catch (error) { help.textContent = error.message; } return; }
    if (!state) { await check(); return; }
    if (state.used || state.claimed.includes(product.id)) return;
    opening = true; add.disabled = true;
    try {
      await prepareForm();
      form.hidden = false; review.hidden = true; pending = null; requestDialog.querySelector('#sample-success').hidden = true;
      form.elements.product.value = product.id;
      requestDialog.querySelector('#sample-product-name').textContent = `${product.collection === 'Mask' ? 'I Wear My Mask All Year Round' : 'Ghost Mode'} — ${product.name}`;
      const previousSize = size.value;
      size.replaceChildren(new Option('Choose your size or format', ''));
      for (const option of product.sizes) size.add(new Option(option, option));
      if (product.sizes.length === 1) size.value = product.sizes[0];
      else if (product.sizes.includes(previousSize)) size.value = previousSize;
      requestDialog.querySelector('#sample-selection-note').textContent = product.note;
      form.querySelector('#submit-status').textContent = '';
      productDialog.close(); requestDialog.showModal();
    } catch (error) { help.textContent = error.message; }
    finally { opening = false; update(); }
  });
  if (token) check();
  else enterCode().catch(error => { help.textContent = error.message; });
}
