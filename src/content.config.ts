import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Lê os markdown das edições, namespaced por newsletter:
// content/<newsletter>/<edicao>.md (ex.: content/aluminio/ed-001.md).
// O id da entrada fica "<newsletter>/<edicao>", de onde derivamos a qual
// newsletter cada edição pertence (ver src/lib/newsletters.ts).
const edicoes = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './content' }),
  schema: z.object({
    edicao: z.number(),
    // `data` no frontmatter (ex.: 2026-07-21) é lido como Date pelo YAML.
    data: z.coerce.date(),
  }),
});

export const collections = { edicoes };
