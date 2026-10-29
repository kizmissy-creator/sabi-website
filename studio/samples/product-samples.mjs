import { catalogue } from './catalogue.mjs';
import { getCart, setCart, clearCart } from './cart.mjs';
const sampleAsset = file => new URL(file, import.meta.url).href;
const cartUrl = new URL('../cart/', import.meta.url);
let token = new URLSearchParams(location.hash.slice(1)).get('invite') || '';
try {
  if (token) sessionStorage.setItem('sabi-sample-invite', token);
  else token = sessionStorage.getItem('sabi-sample-invite') || '';
} catch { /* An invitation still works if browser session storage is disabled. */ }
let started = false;
function startSamples() {
  if (started) return;
  const invitation = new URLSearchParams(location.hash.slice(1)).get('invite');
  if (invitation) {
    token = invitation;
    try { sessionStorage.setItem('sabi-sample-invite', token); } catch {}
  }
  started = true; initialise();
}
startSamples();
window.addEventListener('hashchange', startSamples);

async function initialise() {
  const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = sampleAsset('product-samples.css'); document.head.append(style);
  const productDialog = document.querySelector('#product-dialog');
  const add = document.createElement('button'); add.type = 'button'; add.className = 'button sample-add'; add.textContent = token ? 'Checking sample availability…' : 'Add to cart'; add.disabled = !!token;
  productDialog.querySelector('.close-secondary').before(add);
  const checkoutButton = document.querySelector('[data-sample-checkout]');
  const fromCart = !!checkoutButton;
  const cartStatus = document.querySelector('[data-cart-status]');
  let state, product = fromCart ? getCart() : null, requestDialog, form, size, review, pending, codeDialog, submitting = false, opening = false;
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
    if (!product) return;
    if (!state) {
      add.disabled = false;
      add.textContent = getCart()?.id === product.id ? 'View in cart' : getCart() ? 'Replace sample in cart' : 'Add to cart';
      help.textContent = getCart() && getCart().id !== product.id ? 'Your cart holds one sample. This will replace your current choice.' : 'For invited sample testers. Use your personal code at checkout.';
      return;
    }
    help.textContent = state.test ? 'Test mode — this won’t reserve a real sample.' : '';
    if (state.used) {
      add.textContent = state.status === 'cancelled' ? 'Sample request cancelled' : 'Your sample is already requested'; add.disabled = true;
      help.textContent = `Reference ${state.reference}. Contact Sam to make a change.`;
    } else if (state.claimed.includes(product.id)) {
      add.textContent = 'Sample already claimed'; add.disabled = true;
    } else { add.textContent = getCart()?.id === product.id ? 'View in cart' : getCart() ? 'Replace sample in cart' : 'Add to cart'; add.disabled = false; if (getCart() && getCart().id !== product.id) help.textContent += ' This will replace the sample currently in your cart.'; }
  }
  async function check() {
    if (!token) return;
    try { state = await api('availability'); update(); }
    catch (error) {
      if (error.status === 403) { token = ''; state = null; try { sessionStorage.removeItem('sabi-sample-invite'); } catch {} }
      add.disabled = false; add.textContent = token ? 'Check sample availability' : 'Add to cart'; help.textContent = error.message;
    }
  }
  async function enterCode() {
    if (!codeDialog) {
      const response = await fetch(sampleAsset('code.html'));
      if (!response.ok) throw new Error('The code form couldn’t load. Please try again.');
      const template = document.createElement('template'); template.innerHTML = await response.text(); document.body.append(template.content);
      codeDialog = document.querySelector('#sample-code-dialog');
      codeDialog.querySelector('.sample-close').addEventListener('click', () => codeDialog.close());
      codeDialog.addEventListener('close', () => {
        if (fromCart) { if (token && state && !state.used) openRequest().catch(error => { cartStatus.textContent = error.message; }); else checkoutButton.focus(); }
        else if (product) { productDialog.showModal(); add.focus(); }
      });
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
    const response = await fetch(sampleAsset('form.html'));
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
      if (fromCart) { if (!state?.used) checkoutButton.focus(); return; }
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
    clearCart();
    form.reset(); pending = null; form.hidden = true; review.hidden = true; update();
    const success = requestDialog.querySelector('#sample-success'); success.hidden = false;
    requestDialog.querySelector('#sample-confirmation').textContent = `${state.test ? 'Your test reference' : 'Your reference'} is ${reference}. There is nothing for you to pay.`;
    success.focus();
  }
  async function openRequest() {
    if (!product || opening) return;
    if (!token) { try { await enterCode(); } catch (error) { help.textContent = error.message; } return; }
    await check();
    if (!state || state.used || state.claimed.includes(product.id)) {
      if (cartStatus) cartStatus.textContent = help.textContent || (state?.claimed.includes(product.id) ? 'This sample has already been claimed. Please choose another design.' : 'Please check your code and try again.');
      return;
    }
    opening = true; add.disabled = true;
    try {
      await prepareForm();
      form.hidden = false; review.hidden = true; pending = null; requestDialog.querySelector('#sample-success').hidden = true;
      form.elements.product.value = product.id;
      requestDialog.querySelector('#sample-product-name').textContent = `${product.collection === 'Mask' ? 'I Wear My Mask All Year Round' : product.collection} — ${product.name}`;
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
  }
  add.addEventListener('click', () => {
    if (!product || add.disabled) return;
    setCart(product.id);
    location.assign(cartUrl.href);
  });
  checkoutButton?.addEventListener('click', async () => {
    product = getCart();
    if (!product) return;
    cartStatus.textContent = '';
    try { await openRequest(); } catch (error) { cartStatus.textContent = error.message; }
  });
  if (token) check();
  else if (location.hash === '#samples') enterCode().catch(error => { help.textContent = error.message; });
  window.addEventListener('hashchange', () => { if (location.hash === '#samples' && !token) enterCode().catch(error => { help.textContent = error.message; }); });
}
