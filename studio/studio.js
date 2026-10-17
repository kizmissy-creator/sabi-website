'use strict';
const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
const products = {
 crop: ['I Wear My Mask All Year Round — Washed Crop', 'Five masks hang from a rail: patched, knitted, colourful, cracked and smiling. The design leaves room for humour and recognition without asking you to explain either. The washed crop is being prepared with Inkthreadable, with the artwork on the front and no back logo. The image shown is an earlier sample mockup, so final garment photos will follow.'],
 tee: ['Social Battery 1% — T-Shirt', 'A headphone-wearing ghost sits inside the last bar of a battery, with Ghost Mode Activated underneath. Familiar to anyone whose social energy has run out before the day has. The pictured navy tee is a design mockup; launch colours, measurements and fabric details are still being confirmed.'],
 hoodie: ['Ghost Mode — Heavyweight Hoodie', 'A small Ghost Mode graphic at the front and the Social Battery artwork on the back. The photograph shows an actual camouflage sample. The final launch garment, print placement and colours are being checked, so the sample is a look at the design rather than a promise of every available option.'],
 beanie: ['Ghost — Embroidered Beanie', 'The headphone-wearing ghost appears as a small embroidered detail on a cuffed beanie. The image is a design mockup. We will add yarn, fit and care information before ordering opens.'],
 tote: ['Social Battery — Eco Tote', 'The same Social Battery ghost, on a bag for your everyday things. The image is a design mockup. Material composition, dimensions and care details will be confirmed before launch.']
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
