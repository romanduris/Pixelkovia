import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ['index.html', 'printables.html', 'styles.css', 'adventure.css', 'app.js', 'game-data.js', 'assets']) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}
console.log('Static site prepared in dist/');
