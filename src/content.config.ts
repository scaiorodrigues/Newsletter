import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Lê os markdown que o pipeline já gera em content/edicoes/.
// Nenhuma mudança no fluxo editorial: montar-edicao.cjs continua
// escrevendo ali, e o site consome os mesmos arquivos.
const edicoes = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/edicoes' }),
  schema: z.object({
    edicao: z.number(),
    // `data` no frontmatter (ex.: 2026-07-21) é lido como Date pelo YAML.
    data: z.coerce.date(),
  }),
});

export const collections = { edicoes };
