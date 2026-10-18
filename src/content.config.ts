import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const news = defineCollection({
 loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
 schema: z.object({ title: z.string(), description: z.string(), date: z.coerce.date(), draft: z.boolean().default(true), category: z.string(), author: z.string().default('Swoovr team') }),
});
export const collections = { news };
