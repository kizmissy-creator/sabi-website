import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const output = resolve('dist');
if (dirname(output) !== process.cwd() || !output.endsWith('dist')) throw new Error('Unsafe build output directory');
await rm(output, { recursive: true, force: true });
await mkdir('dist');
for (const path of ['index.html', 'thank-you.html', 'images', 'studio']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
