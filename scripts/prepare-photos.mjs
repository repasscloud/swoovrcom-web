import { readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'people_pics_random');
const output = path.join(root, 'public/people');
const supported = /\.(jpe?g|png|webp|avif|tiff?)$/i;
await mkdir(source, { recursive: true });
await mkdir(output, { recursive: true });
await mkdir(path.join(root, 'src/data'), { recursive: true });
async function discover(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.filter(entry => !entry.name.startsWith('.')).map(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? discover(full) : entry.isFile() && supported.test(entry.name) ? [full] : [];
  }));
  return files.flat().sort();
}
const files = await discover(source);
const photos = [];
// Process sequentially to bound memory even when originals are large.
for (const file of files) {
  const name = `${createHash('sha256').update(path.relative(source, file)).digest('hex').slice(0, 16)}.webp`;
  try {
    await sharp(file).rotate().resize(480, 640, { fit: 'cover', position: 'attention' }).webp({ quality: 78 }).toFile(path.join(output, name));
    photos.push(`/people/${name}`);
  } catch (error) {
    throw new Error(`Cannot prepare photo ${path.relative(source, file)}: ${error.message}`);
  }
}
const keep = new Set(photos.map(photo => path.basename(photo)));
for (const file of await readdir(output)) {
  if (/^[a-f0-9]{16}\.webp$/.test(file) && !keep.has(file)) await rm(path.join(output, file));
}
await writeFile(path.join(root, 'src/data/photos.json'), JSON.stringify(photos, null, 2) + '\n');
console.log(`Prepared ${photos.length} photos. Originals unchanged.`);
