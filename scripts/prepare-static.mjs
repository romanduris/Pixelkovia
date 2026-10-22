import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ['atlas.html', 'atlas.css', 'index.html', 'parent.html', 'storyboard.html', 'game.html', 'site-config.js', 'prep-store.js', 'printables.html', 'signal-print.css', 'styles.css', 'adventure.css', 'party.css', 'presentation.css', 'site-content.js', 'print-materials.js', 'app.js', 'game-data.js', 'story-text.js', 'assets']) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}
console.log('Static site prepared in dist/');
