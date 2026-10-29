import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const source = new URL('../site/studio/', import.meta.url);
const pages = [
  ['home', '', 'SABI Studio | Clothes for your whole self'],
  ['shop', 'shop/', 'Shop the collections | SABI Studio'],
  ['masks', 'masks/', 'I Wear My Mask All Year Round | SABI Studio'],
  ['social-battery', 'social-battery/', 'Social Battery 1% | SABI Studio'],
  ['story', 'story/', 'Our story | SABI Studio'],
  ['help', 'help/', 'Helpful things | SABI Studio'],
  ['contact', 'contact/', 'Contact Sam | SABI Studio'],
  ['cart', 'cart/', 'Your sample cart | SABI Studio'],
];
const legacyLinks = { '#collection': 'shop/', '#mask-collection': 'masks/', '#ghost-collection': 'social-battery/', '#story': 'story/', '#feel': 'help/', '#questions': 'help/', '#making': 'story/' };

export async function renderStudioPages() {
  const template = await readFile(new URL('template.html', source), 'utf8');
  const output = new Map();
  for (const [page, route, title] of pages) {
    const prefix = route ? '../' : '';
    const content = await readFile(new URL(`${page}.html`, source), 'utf8');
    let html = template.replace('{{TITLE}}', title).replaceAll('{{PAGE}}', page).replace('{{CONTENT}}', content);
    html = html.replace(/(href|src)="([^"]+)"/g, (attribute, key, value) => {
      value = legacyLinks[value] || value;
      if (value === './') return `${key}="${prefix || './'}"`;
      if (/^(assets\/|samples\/|studio\.|typography\.|(?:shop|masks|social-battery|story|help|contact|cart)\/)/.test(value)) return `${key}="${prefix}${value}"`;
      return `${key}="${value}"`;
    });
    const active = ['masks', 'social-battery'].includes(page) ? 'shop' : page;
    html = html.replace(`data-page="${active}"`, `data-page="${active}" aria-current="page"`);
    output.set(`${route}index.html`, html);
  }
  return output;
}

export async function writeStudioPages(outputRoot) {
  for (const [path, html] of await renderStudioPages()) {
    const target = resolve(outputRoot, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html);
  }
}
