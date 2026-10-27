import { catalogue } from './catalogue.mjs';
const form = document.querySelector('#sample-form');
const status = document.querySelector('#page-status');
const retry = document.querySelector('#retry');
const submitStatus = document.querySelector('#submit-status');
const submit = document.querySelector('#submit');
const size = document.querySelector('#size');
const token = new URLSearchParams(location.hash.slice(1)).get('invite') || '';
let claimed = [];
let loaded = false;
async function api(action, data = {}) {
  const result = await fetch('/.netlify/functions/sample-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, action, token }), cache: 'no-store' });
  const value = await result.json();
  if (!result.ok) throw new Error(value.error || 'Please try again in a moment.');
  return value;
}
function success(reference, requestStatus) {
  form.hidden = true;
  status.hidden = true;
  retry.hidden = true;
  const section = document.querySelector('#success');
  section.hidden = false;
  document.querySelector('#confirmation').textContent = `Your reference is ${reference}. One sample, saved for you.`;
  if (requestStatus === 'cancelled') {
    section.querySelector('h2').textContent = 'Your request was cancelled.';
    document.querySelector('#confirmation').textContent = `Reference: ${reference}. Please contact Sam if you need help.`;
    section.querySelectorAll('p')[1].textContent = 'This invitation has already been used. No new request has been made.';
  }
  section.focus();
}
function selectProduct(product) {
  size.replaceChildren();
  const placeholder = new Option(product.sizes.length === 1 ? 'Choose the format' : 'Choose your size', '');
  size.add(placeholder);
  product.sizes.forEach(value => size.add(new Option(value, value)));
  if (product.sizes.length === 1) size.value = product.sizes[0];
  size.disabled = false;
  document.querySelector('#selection-note').textContent = product.note;
  document.querySelector('#size-hint').textContent = product.provisional ? '(your usual size — to be confirmed)' : '';
}
async function renderCards() {
  const result = await fetch('../', { cache: 'no-cache' });
  if (!result.ok) throw new Error('The product pictures couldn’t load. Please try again.');
  const source = new DOMParser().parseFromString(await result.text(), 'text/html');
  const grid = document.querySelector('#sample-products');
  for (const product of catalogue) {
    const label = document.createElement('label'); label.className = 'sample-card'; label.dataset.id = product.id;
    const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'product'; radio.value = product.id; radio.required = true; radio.setAttribute('aria-label', `${product.collection} — ${product.name}`);
    radio.addEventListener('change', () => selectProduct(product));
    const visual = source.querySelector(`.product-image[data-product="${product.id}"] .product-visual`)?.cloneNode(true);
    if (visual) {
      visual.className = 'sample-visual';
      for (const image of visual.querySelectorAll('img,image')) {
        for (const attribute of ['src','href']) if (image.hasAttribute(attribute)) image.setAttribute(attribute, new URL(image.getAttribute(attribute), new URL('../', location.href)).href);
      }
      visual.setAttribute('aria-hidden', 'true');
    }
    const family = document.createElement('small'); family.textContent = product.collection === 'Mask' ? 'I Wear My Mask All Year Round' : product.collection;
    const title = document.createElement('strong'); title.textContent = product.name;
    const availability = document.createElement('span'); availability.className = 'availability';
    label.append(radio); if (visual) label.append(visual); label.append(family, title, availability); grid.append(label);
  }
}
function updateAvailability() {
  for (const card of document.querySelectorAll('.sample-card')) {
    const taken = claimed.includes(card.dataset.id);
    const radio = card.querySelector('input'); radio.disabled = taken;
    if (taken && radio.checked) { radio.checked = false; size.replaceChildren(new Option('Choose another item', '')); size.disabled = true; document.querySelector('#selection-note').textContent = ''; }
    card.classList.toggle('taken', taken);
    card.querySelector('.availability').textContent = taken ? 'Already claimed' : 'One sample available';
  }
}
async function load() {
  retry.hidden = true;
  if (!token) { status.textContent = 'This is a little invitation-only sample round. Open the personal link Sam sent you, or ask her for one at info@sabigroup.co.uk.'; return; }
  try {
    const state = await api('availability');
    if (state.used) { success(state.reference, state.status); return; }
    if (!loaded) { await renderCards(); loaded = true; }
    claimed = state.claimed; updateAvailability();
    status.textContent = state.test ? 'TEST INVITATION — these requests stay separate from real friends’ samples.' : 'Your invitation is ready. Choose the one that speaks to you.';
    form.hidden = false;
    if (claimed.length === catalogue.length) { form.hidden = true; status.textContent = 'All the samples have found a person. Thank you for being part of this — ask Sam if anything changes.'; }
  } catch (error) { status.textContent = error.message; retry.hidden = false; }
}
retry.addEventListener('click', load);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  submit.disabled = true; submitStatus.textContent = 'Saving your request…';
  const data = Object.fromEntries(new FormData(form)); data.consent = form.elements.consent.checked;
  try { const saved = await api('reserve', data); form.reset(); success(saved.reference); }
  catch (error) {
    submitStatus.textContent = error.message;
    try { const state = await api('availability'); if (state.used) { form.reset(); success(state.reference, state.status); return; } claimed = state.claimed; updateAvailability(); } catch { /* Keep the form and its details intact for a retry. */ }
  } finally { submit.disabled = false; }
});
load();
