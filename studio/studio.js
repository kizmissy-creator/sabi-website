'use strict';
const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
nav.addEventListener('click', event => { if (event.target.closest('a')) { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); } });
const products = {
  tee: ['Social Battery 1% T-Shirt', 'The Social Battery graphic in the collection’s everyday T-shirt. Final garment, fabric and fit information will be added after production verification.'],
  tote: ['Social Battery Eco Tote', 'The Social Battery character on a tote for everyday essentials. Dimensions and material details will be confirmed before launch.'],
  beanie: ['Ghost Embroidered Beanie', 'A small embroidered ghost detail brings the character into the collection’s accessory. Yarn, sizing and care details will be confirmed before launch.'],
  hoodie: ['Ghost Mode Heavyweight Hoodie', 'A Ghost Mode front detail paired with the Social Battery back graphic. The final hoodie, available colours and measurements will be confirmed before launch.']
};
const dialog = document.querySelector('#product-dialog');
let trigger;
document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
  trigger = button; const [title, copy] = products[button.dataset.product];
  document.querySelector('#product-title').textContent = title;
  document.querySelector('#product-copy').textContent = copy;
  dialog.showModal();
}));
document.querySelectorAll('.close,.close-secondary').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('close', () => trigger?.focus());
