// @ts-check
import { defineConfig } from 'astro/config';
import rehypeExternalLinks from 'rehype-external-links';

// `site`  = domínio raiz onde o hub é publicado.
// `base`  = subcaminho sob o domínio. Em subpasta (fromtech.com.br/newsletters)
//           o deploy define BASE_PATH=/newsletters; em subdomínio, fica "/".
// Os links internos usam import.meta.env.BASE_URL (ver src/lib/newsletters.ts),
// então o mesmo código serve nos dois modos sem alteração manual.
export default defineConfig({
  site: process.env.SITE_URL || 'https://fromtech.com.br',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  markdown: {
    // Links das notícias (fontes) abrem em nova aba, para o leitor não
    // sair da edição. Aplica-se só aos links do conteúdo markdown.
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
});
