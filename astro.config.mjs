// @ts-check
import { defineConfig } from 'astro/config';

// Ajuste `site` para o domínio final da newsletter antes de publicar.
// É usado para gerar URLs absolutas no feed RSS e nos metadados.
export default defineConfig({
  site: 'https://newsletter-aluminio.netlify.app',
  trailingSlash: 'ignore',
});
