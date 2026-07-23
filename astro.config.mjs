// @ts-check
import { defineConfig } from 'astro/config';

// `site` é o domínio final do hub de newsletters da FromTech.
// Usado para gerar URLs absolutas no feed RSS e nos metadados.
// Ajuste se o subdomínio escolhido for diferente.
export default defineConfig({
  site: 'https://newsletter.fromtech.com.br',
  trailingSlash: 'ignore',
});
