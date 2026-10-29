import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { studioSiteId } from '../netlify/lib/studio-site.mjs';
import { writeStudioPages } from './render-studio.mjs';
// Fail before publishing if the sample functions' dependency is not installed.
import.meta.resolve('@netlify/blobs');
const output = resolve('dist');
if (dirname(output) !== process.cwd() || !output.endsWith('dist')) throw new Error('Unsafe build output directory');
await rm(output, { recursive: true, force: true });
await mkdir('dist');
if (process.env.SITE_ID === studioSiteId || process.argv.includes('--studio')) {
  await cp('studio', 'dist', { recursive: true });
  await writeStudioPages('dist');
  // The studio's founder portrait is shared with the company site.
  await mkdir('dist/images', { recursive: true });
  await cp('images/sam-portrait.webp', 'dist/images/sam-portrait.webp');
} else {
for (const path of ['index.html', 'thank-you.html', 'images', 'studio']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
await writeStudioPages('dist/studio');
}
