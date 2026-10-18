'use strict';
const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
const products = {
 crop: ['I Wear My Mask All Year Round — Washed Crop', 'The AS Colour Wo’s Heavy Faded Crop Tee 4089 in Faded Black has a cropped cut and 240gsm fabric. Five masks hang from a rail across the front: patched, knitted, colourful, cracked and smiling. The saved Inkthreadable draft uses a 25.3 × 14.7 cm front print, centred on the upper chest, with a plain back. Final sample photos and measurements will follow.'],
 'mask-oversized': ['I Wear My Mask All Year Round — Oversized Tee', 'A black, full-length AS Colour Classic Oversized Tee 5069, with a roomy cut. The saved draft uses a 28 × 16.2 cm front print, centred on the upper chest, and a plain back. We’re preparing this piece with Inkthreadable and will check the finished print and fit on a sample.'],
 'mask-fitted': ['I Wear My Mask All Year Round — Fitted Tee', 'The black Stella Expresser 2.0 has a gently shaped fitted cut. It is a full-length fitted T-shirt rather than a cropped baby tee. The saved Inkthreadable draft uses a 24 × 13.9 cm front print, with a plain back. The preview shows the selected supplier garment and original artwork at the planned print size. Final fit, colour and placement will be checked on a physical sample.'],
 'mask-hoodie': ['I Wear My Mask All Year Round — Relaxed Hoodie', 'The AWDis Vision hoodie in Deep Black has a relaxed shape and dropped shoulders. The saved Inkthreadable draft uses the chosen 30 × 17.4 cm front print, centred above the pocket, with a plain back. The preview shows the selected supplier garment and original artwork at the planned print size. Final photos and feel notes will follow after sample checks.'],
 'mask-tote': ['I Wear My Mask All Year Round — Heavyweight Tote', 'The black EarthAware Organic Spring Tote W821 carries the full mask illustration on the front, with a plain back. The saved Inkthreadable draft uses a 26 × 15.1 cm print. It is a heavyweight canvas option with shoulder-length handles, with the finished print still to be checked on a sample.'],
 'mask-mini': ['I Wear My Mask All Year Round — Mini Art Print', 'A 6 × 4-inch landscape mini art print on 324gsm matte card, with an envelope, prepared through Prodigi. The front keeps the charcoal background and small SABI signature. The back has a discreet SABI mark and the words “I wear my mask all year round” near the bottom, leaving space for a note. These are artwork previews; colour, small-text clarity and the card finish still need checking on a physical sample.'],
 'mask-a4': ['I Wear My Mask All Year Round — A4 Art Print', 'The full mask illustration in A4 landscape format (29.7 × 21 cm), with a charcoal background and small SABI signature. Prepared for dStudio on Fotospeed Matt Ultra 240gsm smooth matte paper, unframed and unmounted. The image is the artwork preview, not a framed or photographed print. A physical sample will be checked before orders open.'],
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
 const card = button.closest('.product');
 const preview = document.querySelector('#product-preview');
 const imageButton = card.querySelector('.product-image');
 preview.className = 'dialog-preview ' + imageButton.className.replace('product-image', '');
 const visual = card.querySelector('.product-visual').cloneNode(true);
 const caption = document.createElement('figcaption');
 caption.textContent = card.querySelector('.image-caption').textContent;
 preview.replaceChildren(visual, caption);
 if (button.dataset.product === 'mask-mini') {
  const back = document.createElement('img');
  back.src = 'assets/mask-mini-front-back.jpg';
  back.alt = 'Mini print artwork: refined SABI branding on the back at left, mask illustration on the front at right';
  back.className = 'print-spread';
  preview.append(back);
  const spreadCaption = document.createElement('figcaption');
  spreadCaption.textContent = 'Back (left) and front (right) · Artwork preview';
  preview.append(spreadCaption);
 }
 dialog.showModal();
}));
document.querySelectorAll('.close,.close-secondary').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('close', () => trigger?.focus());
