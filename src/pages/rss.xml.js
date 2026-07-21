import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const edicoes = (await getCollection('edicoes')).sort(
    (a, b) => b.data.edicao - a.data.edicao,
  );

  return rss({
    title: 'Alumínio em Perfil',
    description:
      'Curadoria quinzenal global sobre alumínio e manufatura de perfis — impacto Brasil.',
    site: context.site,
    items: edicoes.map((ed) => ({
      title: `Edição ${ed.data.edicao}`,
      pubDate: ed.data.data,
      link: `/edicoes/${ed.id}/`,
    })),
    customData: `<language>pt-br</language>`,
  });
}
