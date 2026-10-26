import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const entries = ['atlas.html', 'atlas.css', 'index.html', 'checkout.html', 'checkout.js', 'checkout.css', 'sales-page.js', 'sales.css', 'parent.html', 'storyboard.html', 'game.html', 'site-config.js', 'prep-store.js', 'printables.html', 'signal-print.css', 'styles.css', 'adventure.css', 'party.css', 'presentation.css', 'site-content.js', 'print-materials.js', 'app.js', 'cipko-game.js', 'game-data.js', 'story-text.js', 'assets'];
for (const entry of entries) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}
// A changed script gets a new URL, so published pages cannot reuse an older
// game configuration or player implementation from the browser cache.
const versions = new Map();
for (const entry of entries.filter(name => /\.(js|css)$/.test(name))) {
  const bytes = await readFile(path.join(root, entry));
  versions.set(entry, createHash('sha256').update(bytes).digest('hex').slice(0, 12));
}
for (const entry of entries.filter(name => name.endsWith('.html'))) {
  const target = path.join(output, entry);
  const html = await readFile(target, 'utf8');
  await writeFile(target, html.replace(/\b(src|href)="([^"]+)"/g, (attribute, kind, url) => {
    const pathname = url.split(/[?#]/)[0];
    const version = versions.get(pathname.replace(/^\.\//, ''));
    return version ? `${kind}="${pathname}?v=${version}"` : attribute;
  }));
}
console.log('Static site prepared in dist/ with content-versioned scripts and styles.');
