import { catalogue } from './catalogue.mjs';
const key = 'sabi-sample-cart';
let selected;
try { selected = sessionStorage.getItem(key); } catch {}

export function getCart() { return catalogue.find(item => item.id === selected) || null; }
export function setCart(id) {
  if (!catalogue.some(item => item.id === id)) throw new Error('Unknown sample');
  selected = id;
  try { sessionStorage.setItem(key, id); } catch {}
  renderCart();
}
export function clearCart() {
  selected = null;
  try { sessionStorage.removeItem(key); } catch {}
  renderCart();
}
function renderCart() {
  const item = getCart();
  document.querySelectorAll('[data-cart-count]').forEach(count => { count.textContent = item ? '1' : '0'; });
  const empty = document.querySelector('[data-cart-empty]');
  if (!empty) return;
  empty.hidden = !!item;
  document.querySelector('[data-cart-item]').hidden = !item;
  if (item) {
    document.querySelector('[data-cart-collection]').textContent = item.collection === 'Mask' ? 'I Wear My Mask All Year Round' : item.collection;
    document.querySelector('[data-cart-name]').textContent = item.name;
    document.querySelector('[data-cart-note]').textContent = item.note;
  }
}
document.querySelector('[data-cart-remove]')?.addEventListener('click', clearCart);
renderCart();
