import rss from '@astrojs/rss';
import { newsletters, getNewsletter, edicoesDe, splitId } from '../../lib/newsletters';

export async function getStaticPaths() {
  return newsletters.map((n) => ({ params: { newsletter: n.slug } }));
}

export async function GET(context) {
  const slug = context.params.newsletter;
  const info = getNewsletter(slug);
  const eds = await edicoesDe(slug);

  return rss({
    title: info.titulo,
    description: info.descricao,
    site: context.site,
    items: eds.map((ed) => ({
      title: `Edição ${ed.data.edicao}`,
      pubDate: ed.data.data,
      link: `/${slug}/${splitId(ed.id).edicao}/`,
    })),
    customData: `<language>pt-br</language>`,
  });
}
