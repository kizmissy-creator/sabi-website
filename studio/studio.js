'use strict';
const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
const products = {
 crop: ['I Wear My Mask All Year Round · Washed Crop', "Five masks across the front of a short, boxy crop, with a plain back. The 240gsm cotton gives it a substantial feel, while the washed black finish keeps it looking lived in."],
 'mask-oversized': ['I Wear My Mask All Year Round · Oversized Tee', "Five masks and familiar words on a roomy black tee. A full-length, oversized shape with dropped shoulders and a plain back."],
 'mask-fitted': ['I Wear My Mask All Year Round · Fitted Tee', "The same five masks on a gently shaped black tee. A full-length fitted cut with a plain back."],
 'mask-hoodie': ['I Wear My Mask All Year Round · Relaxed Hoodie', "Five masks across the front, just above the pocket. A relaxed black hoodie with dropped shoulders, a hood without drawcords and a plain back."],
 'mask-tote': ['I Wear My Mask All Year Round · Heavyweight Tote', "Take the masks along. The complete illustration on substantial black cotton canvas, with long handles for carrying by hand or over your shoulder."],
 'mask-mini': ['I Wear My Mask All Year Round · Mini Art Print', "A 6 × 4-inch landscape print on 324gsm matte card, with an envelope. The mask illustration sits on a charcoal background. A small SABI mark on the back leaves room for a note."],
 'mask-a4': ['I Wear My Mask All Year Round · A4 Art Print', "The complete mask illustration on smooth 240gsm matte paper. A4 landscape, 29.7 × 21cm, with a charcoal background and small SABI signature. Unframed and unmounted."],
 tee: ['Social Battery 1% · T-Shirt', 'A headphone-wearing ghost sits inside the last bar of a battery, with Ghost Mode Activated underneath. Familiar to anyone whose social energy has run out before the day has. The pictured navy tee is a design mockup; launch colours, measurements and fabric details are still being confirmed.'],
 hoodie: ['Ghost Mode · Heavyweight Hoodie', 'A small Ghost Mode graphic at the front and the Social Battery artwork on the back. The photograph shows an actual camouflage sample. The final launch garment, print placement and colours are being checked, so the sample is a look at the design rather than a promise of every available option.'],
 beanie: ['Ghost · Embroidered Beanie', 'The headphone-wearing ghost appears as a small embroidered detail on a cuffed beanie. The image is a design mockup. We will add yarn, fit and care information before ordering opens.'],
 tote: ['Social Battery · Eco Tote', 'The same Social Battery ghost, on a bag for your everyday things. The image is a design mockup. Material composition, dimensions and care details will be confirmed before launch.']
};
const launchProducts = {"sb-tee": {"id": "sb-tee", "key": "tee", "name": "Social Battery 1% · Oversized Tee", "short": "Oversized tee", "colour": "Black", "role": "Core range", "lead": "Headphones on. Ghost mode activated. A roomy black tee for a familiar feeling.", "description": "The headphone-wearing ghost sits inside the last bar of a battery, with worn lettering in cream and rust. A roomy, full-length tee in 220gsm cotton, with dropped shoulders and a plain back. For the days you want a little more space.", "facts": ["220gsm, 100% combed cotton", "Full-length oversized fit with dropped shoulders", "Front print; plain back", "Printed to order in the UK"], "fit": "Already cut oversized. Compare a tee you like laid flat before choosing; there is no need to size up simply to get the intended roomy shape. Medium is approximately 63cm across the chest and 71.5cm long.", "size_range": "S–3XL, subject to colour and supplier availability", "size_source": "https://ascolour.co.uk/classic-oversized-tee-5069/", "status": "draft", "care": "Wash at 30°C. Do not tumble dry or iron the print. Follow the sewn-in label for the garment’s care instructions.", "availability": "In the making. I’m checking the finished print, colour and fit before orders open."}, "sb-hoodie": {"id": "sb-hoodie", "key": "hoodie", "name": "Social Battery 1% · Relaxed Hoodie", "short": "Relaxed hoodie", "colour": "Deep Black", "role": "Core range", "lead": "A little space, a little warmth, and a ghost who gets it.", "description": "A small Ghost Mode mark on the left chest, with the full Social Battery design on the back. The 340gsm fleece has a brushed inside, with dropped shoulders and a relaxed fit. A little space, a little warmth, and a ghost who gets it.", "facts": ["340gsm fleece; 70% ringspun cotton, 30% polyester", "Cotton face with brushed fleece inside", "7.5cm left-chest mark; 26cm back print", "Kangaroo pocket; hood without drawcords", "Printed to order in the UK"], "fit": "Relaxed and oversized, with dropped shoulders. Compare the manufacturer’s garment measurements with a hoodie you already enjoy wearing, allowing room for the layers you want underneath.", "size_range": "XS–5XL, subject to colour and supplier availability", "size_source": "https://awdis.com/products/vision-heavyweight-hoodie-jh111/", "status": "draft", "care": "Wash at 30°C. Do not tumble dry or iron the print. Follow the sewn-in label for the garment’s care instructions.", "availability": "In the making. I’m checking the finished print, colour and fit before orders open."}, "sb-tote": {"id": "sb-tote", "key": "tote", "name": "Social Battery 1% · Heavyweight Tote", "short": "Heavyweight tote", "colour": "Black", "role": "Core range", "lead": "For the everyday things. The ghost comes along too.", "description": "The full Social Battery design on heavyweight black canvas, with long handles for carrying by hand or over your shoulder. The 407gsm organic cotton gives it a substantial feel. For the everyday things. The ghost comes along too.", "facts": ["407gsm, 100% organic brushed cotton canvas", "Approximately 38 × 41cm", "63cm handles", "20cm front print; plain back; UK printing"], "fit": "One size. Bag dimensions are approximately 38cm wide by 41cm high, with 63cm handles. Compare with a bag you use to judge the size; dimensions do not specify a tested load capacity.", "size_range": "One size", "size_source": "https://www.inkthreadable.co.uk/earthaware-organic-spring-tote?tab=sizing", "status": "draft", "care": "We will confirm care for the finished printed tote before ordering opens.", "availability": "In the making. I’m checking the finished print, colour and fit before orders open."}, "sb-crop": {"id": "sb-crop", "key": "crop", "name": "Ghost Mode · Washed Crop", "short": "Washed crop", "colour": "Faded Black", "role": "Alternative silhouette", "lead": "A quieter ghost on a heavier, 240gsm cotton crop. The washed finish gives the black a faded, lived-in feel.", "description": "The headphone-wearing ghost and Ghost Mode lettering on a short, boxy crop. At 240gsm, the cotton is heavier than our 220gsm oversized tee. The washed finish gives the black a faded, lived-in look that works with the worn cream-and-rust artwork.", "facts": ["240gsm, 100% carded cotton; heavier than our oversized tee", "Washed Faded Black finish; boxy crop with dropped shoulders", "Front print; plain back", "Printed to order in the UK"], "fit": "Short and boxy, rather than close-fitting. Check both width and length against a crop you like. Medium is approximately 52.5cm across the chest and 48cm long; where the hem sits will depend on your proportions.", "size_range": "XS–2XL, subject to colour and supplier availability", "size_source": "https://ascolour.co.uk/wos-heavy-faded-crop-tee-4089/", "status": "draft", "care": "Wash at 30°C. Do not tumble dry or iron the print. Follow the sewn-in label for the garment’s care instructions.", "availability": "In the making. I’m checking the finished print, colour and fit before orders open."}};
Object.entries(launchProducts).forEach(([id,p]) => { products[id]=[p.name,p.description]; });
const dialog = document.querySelector('#product-dialog');
let trigger;
document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
 trigger = button; const [title, copy] = products[button.dataset.product];
 document.querySelector('#product-title').textContent = title;
 document.querySelector('#product-copy').textContent = copy;
 const detailBox=document.querySelector('#launch-product-details'); detailBox.replaceChildren();
 const launch=launchProducts[button.dataset.product];
 if(launch){
  const list=document.createElement('ul'); launch.facts.forEach(f=>{const li=document.createElement('li');li.textContent=f;list.append(li)}); detailBox.append(list);
  const sizing=document.createElement('details'); const summary=document.createElement('summary');summary.textContent='Size & fit';sizing.append(summary);
  for(const value of [launch.size_range,launch.fit,'Measure a garment laid flat, without stretching: across the chest just below the armholes, then from the high shoulder to the hem. These are garment measurements, not body measurements. Manufacturer measurements are approximate.']){ if(launch.key==='tote' && value.startsWith('Measure a garment'))continue;const p=document.createElement('p');p.textContent=value;sizing.append(p);}
  const sizeLink=document.createElement('a');sizeLink.href=launch.size_source;sizeLink.textContent='View the full size guide';sizeLink.target='_blank';sizeLink.rel='noopener';sizing.append(sizeLink);detailBox.append(sizing);
  const care=document.createElement('details');const cs=document.createElement('summary');cs.textContent='Care';care.append(cs);const cp=document.createElement('p');cp.textContent=launch.care;care.append(cp);detailBox.append(care);

 }

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
