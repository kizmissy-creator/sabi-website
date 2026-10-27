import { catalogue } from './catalogue.mjs';
let token = new URLSearchParams(location.hash.slice(1)).get('invite') || '';
try {
  if (token) sessionStorage.setItem('sabi-sample-invite', token);
  else token = sessionStorage.getItem('sabi-sample-invite') || '';
} catch { /* An invitation still works if browser session storage is disabled. */ }
if (token) initialise();

async function initialise() {
  const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = 'samples/product-samples.css'; document.head.append(style);
  const productDialog = document.querySelector('#product-dialog');
  const add = document.createElement('button'); add.type = 'button'; add.className = 'button sample-add'; add.textContent = 'Checking sample availability…'; add.disabled = true;
  productDialog.querySelector('.close-secondary').before(add);
  let state, product, requestDialog, form, size, submitting = false, opening = false;
  const help = document.createElement('p'); help.className = 'sample-help'; help.setAttribute('role', 'status'); add.after(help);
  async function api(action, data = {}) {
    let response;
    try {
      response = await fetch('/.netlify/functions/sample-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, action, token }), cache: 'no-store', signal: AbortSignal.timeout(20000) });
    } catch { throw new Error('We couldn’t confirm the request. Please try again; your details are still here.'); }
    let value;
    try { value = await response.json(); } catch { throw new Error('Sample requests are temporarily unavailable. Please try again.'); }
    if (!response.ok) throw new Error(value.error || 'Please try again in a moment.');
    return value;
  }
  function update() {
    if (!state || !product) return;
    help.textContent = '';
    if (state.used) {
      add.textContent = state.status === 'cancelled' ? 'Sample request cancelled' : 'Your sample is already requested'; add.disabled = true;
      help.textContent = `Reference ${state.reference}. Contact Sam to make a change.`;
    } else if (state.claimed.includes(product.id)) {
      add.textContent = 'Sample already claimed'; add.disabled = true;
    } else { add.textContent = 'Add sample'; add.disabled = false; }
  }
  async function check() {
    try { state = await api('availability'); update(); }
    catch (error) { add.disabled = false; add.textContent = 'Check sample availability'; help.textContent = error.message; }
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
      submitting = true;
      const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
      const status = form.querySelector('#submit-status'); status.textContent = 'Saving your sample request…';
      const values = Object.fromEntries(new FormData(form)); values.consent = form.elements.consent.checked;
      try { const saved = await api('reserve', values); showSuccess(saved.reference); }
      catch (error) {
        status.textContent = error.message;
        try { state = await api('availability'); update(); if (state.used && state.status !== 'cancelled') showSuccess(state.reference); }
        catch { /* Keep entered details available for a retry. */ }
      } finally { submitting = false; submit.disabled = false; }
    });
  }
  function showSuccess(reference) {
    state = { ...state, used: true, reference };
    form.reset(); form.hidden = true; update();
    const success = requestDialog.querySelector('#sample-success'); success.hidden = false;
    requestDialog.querySelector('#sample-confirmation').textContent = `Your reference is ${reference}. There is nothing for you to pay.`;
    success.focus();
  }
  add.addEventListener('click', async () => {
    if (!product || opening) return;
    if (!state) { await check(); return; }
    if (state.used || state.claimed.includes(product.id)) return;
    opening = true; add.disabled = true;
    try {
      await prepareForm();
      form.hidden = false; requestDialog.querySelector('#sample-success').hidden = true;
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
  check();
}
