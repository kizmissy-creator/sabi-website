import { catalogue } from './catalogue.mjs';
const parameters = new URLSearchParams(location.hash.slice(1));
const token = parameters.get('admin') || '';
const test = parameters.get('test') === 'true';
const status = document.querySelector('#admin-status');
const requests = document.querySelector('#requests');
const node = (tag, text) => { const element = document.createElement(tag); element.textContent = text; return element; };
async function api(action, extra = {}) {
  const result = await fetch('/.netlify/functions/sample-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, test, action, ...extra }), cache: 'no-store' });
  const data = await result.json(); if (!result.ok) throw new Error(data.error || 'Please try again.'); return data;
}
async function load() {
  if (!token) { status.textContent = 'Open the private organiser link in your local SABI invitations file.'; return; }
  status.textContent = 'Checking requests…';
  try {
    const data = await api('list'); requests.replaceChildren();
    status.textContent = `${test ? 'TEST ROUND · ' : ''}${data.claims.length} request${data.claims.length === 1 ? '' : 's'}. ${data.claims.length ? 'No supplier orders are placed automatically.' : 'No requests yet.'}`;
    for (const claim of data.claims) {
      const product = catalogue.find(item => item.id === claim.product) || { collection: 'Earlier sample range', name: claim.product };
      const article = node('article', ''); article.className = 'admin-request';
      article.append(node('h2', `${product.collection} — ${product.name}`), node('p', `${claim.reference} · ${claim.status}\nRequested ${new Date(claim.createdAt).toLocaleString('en-GB')}\nSize / format: ${claim.size}`), node('p', `${claim.name}\n${claim.email}\n${[claim.address1, claim.address2, claim.city, claim.region, claim.postcode, claim.country].filter(Boolean).join('\n')}`));
      if (claim.notes) article.append(node('p', `Notes: ${claim.notes}`));
      if (claim.status !== 'cancelled') {
        const actions = node('div', ''); actions.className = 'admin-actions';
        const label = node('label', 'Request status'); const select = node('select', '');
        for (const value of ['requested', 'ordered', 'sent', 'cancelled']) select.add(new Option(value, value));
        select.value = claim.status; label.append(select);
        const save = node('button', 'Save status'); save.className = 'button'; save.type = 'button';
        const message = node('p', ''); message.setAttribute('role', 'status');
        save.addEventListener('click', async () => {
          if (select.value === 'cancelled' && !confirm('Cancel this request and make the item available again? The invitation will stay used.')) return;
          save.disabled = true;
          try { await api('status', { reference: claim.reference, status: select.value }); await load(); }
          catch (error) { message.textContent = error.message; save.disabled = false; }
        });
        actions.append(label, save); article.append(actions, message);
      }
      requests.append(article);
    }
  } catch (error) { status.textContent = error.message; }
}
document.querySelector('#refresh').addEventListener('click', load);
load();
