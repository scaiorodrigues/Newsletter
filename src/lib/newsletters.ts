import { getCollection } from 'astro:content';
import registro from '../../data/newsletters.json';

export interface Newsletter {
  slug: string;
  titulo: string;
  descricao: string;
  periodicidade?: string;
}

export const newsletters: Newsletter[] = registro.newsletters;

export function getNewsletter(slug: string): Newsletter | undefined {
  return newsletters.find((n) => n.slug === slug);
}

// Os ids da coleção vêm no formato "<newsletter>/<edicao>" (ex.: aluminio/ed-001)
export function splitId(id: string): { newsletter: string; edicao: string } {
  const i = id.indexOf('/');
  return { newsletter: id.slice(0, i), edicao: id.slice(i + 1) };
}

// Edições de uma newsletter, mais recentes primeiro.
export async function edicoesDe(slug: string) {
  const todas = await getCollection('edicoes');
  return todas
    .filter((e) => splitId(e.id).newsletter === slug)
    .sort((a, b) => b.data.edicao - a.data.edicao);
}

export const fmtData = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

// Gera URLs internas respeitando o base (subpasta) do deploy.
// import.meta.env.BASE_URL vale "/" em dev/subdomínio e "/newsletter/" na
// subpasta — assim os mesmos templates funcionam nos dois modos.
export function link(path = ''): string {
  const base = import.meta.env.BASE_URL;
  const b = base.endsWith('/') ? base : base + '/';
  return b + path.replace(/^\//, '');
}
