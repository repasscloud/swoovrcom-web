import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export async function collectRoutes(directory = 'dist', prefix = '') {
 const routes = [];
 for (const entry of await readdir(directory, {withFileTypes:true})) {
  if (entry.isDirectory()) routes.push(...await collectRoutes(join(directory,entry.name), `${prefix}/${entry.name}`));
  else if (entry.name === 'index.html') routes.push(`${prefix}/`);
 }
 return routes.sort();
}
const routes = await collectRoutes();
await writeFile('src/data/published-routes.json', JSON.stringify(routes,null,2)+'\n');
console.log(`Sitemap includes ${routes.length} published pages.`);
