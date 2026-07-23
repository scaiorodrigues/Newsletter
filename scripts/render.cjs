/**
 * render.cjs — renderização do markdown de uma edição.
 * Compartilhado por montar-edicao.cjs (ao publicar) e regerar-md.cjs
 * (ao reaplicar o formato a edições já registradas).
 *
 * A prévia de validação (anotação editorial) NÃO entra aqui — ela é
 * exibida só no console do pipeline, para revisão humana.
 */

// Nome de exibição do tópico (divisor de seção) a partir do slot do mix.
// Slots de reposição caem no mesmo tópico do slot base.
const TOPICO = {
  global_estrategico: 'GLOBAL ESTRATÉGICO',
  brasil_em_foco: 'BRASIL EM FOCO',
  tecnologia_prd: 'TECNOLOGIA / P&D',
  empresas_operacoes: 'EMPRESAS E OPERAÇÕES',
  aplicacoes: 'APLICAÇÕES',
};

const baseSlot = (s) => s.replace(/_reposicao$/, '');
const topicoDe = (s) => TOPICO[baseSlot(s)] || baseSlot(s).toUpperCase();

const fmtData = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

// Campo "Relação": liga a notícia a outras JÁ publicadas (no conjunto
// `postados`). A primeira relação vira o resumo principal; as demais,
// já publicadas, são citadas ao final.
function relacaoTexto(item, pool, postados) {
  const rels = (item.relacionadas || []).filter(
    (r) => r.id !== item.id && postados.has(r.id),
  );
  if (!rels.length) return null;
  const tituloDe = (id) =>
    (pool.itens.find((i) => i.id === id) || {}).titulo || id;
  const principal = rels[0];
  let txt = `Conecta-se com **${tituloDe(principal.id)}** — ${principal.nota}.`;
  const outras = rels.slice(1);
  if (outras.length) {
    txt += ` Ver também: ${outras.map((o) => `*${tituloDe(o.id)}*`).join('; ')}.`;
  }
  return txt;
}

// Bloco de uma notícia (título em ###, campos como parágrafos próprios).
function blocoItem(entry, pool, postados) {
  const item = pool.itens.find((i) => i.id === entry.id);
  if (!item) return [`### (item ${entry.id} não encontrado)`, ''];
  const ang = item.angulos.find((a) => a.id === entry.angulo) || {};
  const out = [`### ${item.titulo}`, ''];
  out.push(`<!-- ${item.id}/${entry.angulo} · ${item.bloco} · ${item.veiculo} -->`, '');

  if (item.requer_traducao) {
    out.push('> ⚠️ **Requer tradução** — texto abaixo é a versão editada em PT.', '');
  }

  out.push(`**Ângulo:** ${ang.desc || ''}`, '');
  out.push(`**Impacto Brasil:** ${ang.impacto_brasil || ''}`, '');
  out.push(item.texto_editado || '_[redigir]_', '');
  out.push(`**Fonte:** [${item.veiculo}](${item.url})`, '');

  const rel = relacaoTexto(item, pool, postados);
  if (rel) out.push(`**Relação:** ${rel}`, '');

  return out;
}

/**
 * Gera o conteúdo markdown completo de uma edição.
 * @param {object} o
 * @param {number} o.numero
 * @param {string} o.dataISO  data no formato YYYY-MM-DD
 * @param {Array}  o.itens    [{ id, angulo, slot }]
 * @param {?string} o.linhaId id da linha de perfil (ou null)
 * @param {object} o.pool
 * @param {object} o.linhas
 * @param {Set}    o.postados ids considerados já publicados (inclui esta edição)
 */
function renderEdicaoMd({ numero, dataISO, itens, linhaId, pool, linhas, postados }) {
  const linhasMd = [
    '---',
    `edicao: ${numero}`,
    `data: ${dataISO}`,
    '---',
    '',
    `# Edição ${numero} — ${fmtData(dataISO)}`,
    '',
  ];

  // Agrupa por tópico preservando a ordem do mix.
  let topicoAtual = null;
  for (const entry of itens) {
    const t = topicoDe(entry.slot);
    if (t !== topicoAtual) {
      linhasMd.push(`## ${t}`, '');
      topicoAtual = t;
    }
    linhasMd.push(...blocoItem(entry, pool, postados));
  }

  // Linha de perfil (seção própria), quando houver.
  if (linhaId) {
    const l = linhas.linhas.find((x) => x.id === linhaId);
    if (l) {
      linhasMd.push('## LINHA DE PERFIL', '');
      linhasMd.push(`### ${l.empresa} — ${l.linha}`, '');
      if (l.angulo_editorial) linhasMd.push(l.angulo_editorial, '');
      if (l.fonte) linhasMd.push(`**Fonte:** ${l.fonte}`, '');
    }
  }

  linhasMd.push(
    '',
    '_Curadoria e edição: [FromTech](https://www.linkedin.com/company/121613929/)_',
    '',
  );

  return linhasMd.join('\n');
}

module.exports = { renderEdicaoMd, relacaoTexto, topicoDe, TOPICO };
