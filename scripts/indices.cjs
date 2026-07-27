#!/usr/bin/env node
/**
 * indices.cjs — gera os índices de curadoria em curadoria/ :
 *   - noticias-disponiveis.md : notícias com ângulos livres p/ próximas edições
 *   - noticias-usadas.md      : ângulos já publicados, por edição + estado
 *   - noticias-por-tipo.md    : inventário de notícias agrupado por tópico
 *   - linhas-perfis.md        : banco de linhas de perfil para seleção
 *
 * São documentos GERADOS. Rode `npm run indices` para atualizar; não editar
 * à mão. montar-edicao.cjs também os regenera ao publicar uma edição.
 */
const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const CURADORIA = path.join(ROOT, 'curadoria');
const pool    = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pool.json'), 'utf8'));
const edicoes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'edicoes.json'), 'utf8'));
const linhas  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'linhas-perfis.json'), 'utf8'));

// Ordem e nomes de exibição dos blocos temáticos (ver README).
const BLOCOS = [
  ['mercado_global',              'Mercado Global'],
  ['tecnologia_prd',              'Tecnologia e P&D'],
  ['empresas_operacoes',          'Empresas e Operações'],
  ['politica_comercial_normas',   'Política Comercial e Normas'],
  ['aplicacoes_mercados_fim',     'Aplicações e Mercados-Fim'],
  ['brasil_em_foco',              'Brasil em Foco'],
];

const fmtData = (iso) =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR',
    { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

// Janela de frescor da curadoria: notícia com mais de 30 dias (por data do
// fato) sai do banco ativo e cai em "não tratadas". Evergreens (sem
// data_fato) são atemporais e não expiram por aqui.
const JANELA_CURADORIA = 30;
const hoje = new Date();
const diasDesde = (iso) => (iso ? Math.floor((hoje - new Date(iso + 'T12:00:00')) / 864e5) : null);
const fresca = (i) => {
  if (i.tipo === 'evergreen' || !i.data_fato) return true; // atemporal
  return diasDesde(i.data_fato) <= JANELA_CURADORIA;
};

const item = (id) => pool.itens.find((i) => i.id === id);
const linha = (id) => linhas.linhas.find((l) => l.id === id);
const avisoGerado = '> Documento gerado por `npm run indices` — não editar à mão.';

// ── noticias-usadas.md ──────────────────────────────────────────────────────
function gerarUsadas() {
  const out = ['# Notícias já usadas', '', avisoGerado, ''];

  out.push('## Por edição', '');
  if (!edicoes.edicoes.length) out.push('_Nenhuma edição publicada ainda._', '');
  for (const ed of [...edicoes.edicoes].sort((a, b) => a.numero - b.numero)) {
    out.push(`### Edição ${ed.numero} — ${fmtData(ed.data)}`, '');
    for (const it of ed.itens) {
      const i = item(it.id) || {};
      out.push(`- **${it.id} / ${it.angulo}** — ${i.titulo || '?'}  \`${i.bloco || '?'} · ${i.veiculo || '?'}\``);
    }
    if (ed.linha_perfil) {
      const l = linha(ed.linha_perfil) || {};
      out.push(`- **Linha de perfil ${ed.linha_perfil}** — ${l.empresa || '?'}: ${l.linha || '?'}`);
    }
    out.push('');
  }

  out.push('## Ângulos queimados por notícia', '');
  const usados = pool.itens.filter((i) => i.angulos.some((a) => a.usado_em !== null));
  if (!usados.length) out.push('_Nenhum ângulo publicado ainda._', '');
  for (const i of usados) {
    const queimados = i.angulos.filter((a) => a.usado_em !== null)
      .map((a) => `${a.id} (ed. ${a.usado_em})`).join(', ');
    const livres = i.angulos.filter((a) => a.usado_em === null).map((a) => a.id);
    out.push(`- **${i.id}** (${i.status}) — ${i.titulo}`);
    out.push(`  - Usados: ${queimados}`);
    out.push(`  - Livres: ${livres.length ? livres.join(', ') : '— (esgotada)'}`);
  }
  out.push('');
  return out.join('\n');
}

// ── noticias-por-tipo.md ────────────────────────────────────────────────────
function gerarPorTipo() {
  const out = ['# Notícias por tópico', '', avisoGerado, ''];
  out.push('Inventário de todas as notícias do pool, agrupadas por bloco temático.', '');

  for (const [slug, nome] of BLOCOS) {
    const itens = pool.itens.filter((i) => i.bloco === slug);
    out.push(`## ${nome}`, '');
    if (!itens.length) { out.push('_Sem itens._', ''); continue; }
    for (const i of itens) {
      const total = i.angulos.length;
      const livres = i.angulos.filter((a) => a.usado_em === null).length;
      const flags = [];
      if (i.origem && i.origem !== 'BR') flags.push(i.origem);
      if (i.requer_traducao) flags.push('traduzir');
      const flagTxt = flags.length ? ` · ${flags.join(' · ')}` : '';
      out.push(`- **${i.id}** — ${i.titulo}`);
      out.push(`  - \`${i.tipo} · peso ${i.peso} · status ${i.status} · ${livres}/${total} ângulos livres · ${i.veiculo}${flagTxt}\``);
    }
    out.push('');
  }
  return out.join('\n');
}

// ── linhas-perfis.md ────────────────────────────────────────────────────────
function gerarLinhas() {
  const obrig = linhas._meta.campos_obrigatorios_para_validacao || [];
  const rotulo = {
    empresa: 'empresa', linha: 'linha', tipo: 'tipo',
    liga_tempera: 'liga/têmpera', diferencial_tecnico: 'diferencial técnico',
    aplicacao_alvo: 'aplicação', fonte: 'fonte', data_confirmada: 'data confirmada',
  };
  const faltam = (l) => obrig.filter((c) => !l[c]).map((c) => rotulo[c] || c);

  const validadas = linhas.linhas.filter((l) => l.validado).length;
  const rascunhos = linhas.linhas.filter((l) => l.status === 'rascunho').length;
  const meta = linhas._meta.meta_estoque_minimo;

  const out = ['# Linhas de perfil — banco para seleção', '', avisoGerado, ''];
  out.push(
    `Estoque: **${validadas} validadas** · ${rascunhos} rascunhos · meta mínima ${meta}.`,
    '',
    'Seção fixa da newsletter: **1 linha por edição**. Use esta lista para revisar',
    'e escolher as próximas — cada rascunho mostra o que falta para validar.',
    '',
  );

  const ficha = (l) => {
    const f = faltam(l);
    out.push(`### ${l.id} — ${l.empresa}: ${l.linha}`);
    out.push(`- \`${l.pais || '?'} · ${l.tipo || '?'} · status ${l.status}${l.validado ? ' · validado' : ''}\``);
    if (l.aplicacao_alvo)        out.push(`- **Aplicação:** ${l.aplicacao_alvo}`);
    if (l.liga_tempera)          out.push(`- **Liga/têmpera:** ${l.liga_tempera}`);
    if (l.diferencial_tecnico)   out.push(`- **Diferencial:** ${l.diferencial_tecnico}`);
    if (l.norma_associada)       out.push(`- **Norma:** ${l.norma_associada}`);
    if (l.angulo_editorial)      out.push(`- **Ângulo editorial:** ${l.angulo_editorial}`);
    if (l.fonte)                 out.push(`- **Fonte:** ${l.fonte}`);
    out.push(`- **Falta para validar:** ${f.length ? f.join(', ') : '✓ nada (pronta)'}`);
    if (l.obs)                   out.push(`- **Obs:** ${l.obs}`);
    out.push('');
  };

  const disponiveis = linhas.linhas.filter((l) => l.edicao === null || l.edicao === undefined);
  const usadas = linhas.linhas.filter((l) => l.edicao != null);

  out.push('## Disponíveis para próximas edições', '');
  if (!disponiveis.length) out.push('_Nenhuma disponível._', '');
  disponiveis.forEach(ficha);

  out.push('## Já publicadas', '');
  if (!usadas.length) out.push('_Nenhuma ainda._', '');
  for (const l of usadas) {
    out.push(`- **${l.id}** — ${l.empresa}: ${l.linha} — edição ${l.edicao}`);
  }
  out.push('');
  return out.join('\n');
}

// ── noticias-disponiveis.md ─────────────────────────────────────────────────
// Notícias prontas para próximas edições: status usável e ângulos livres.
function gerarDisponiveis() {
  const out = ['# Notícias disponíveis para próximas edições', '', avisoGerado, ''];
  out.push(
    `Notícias **recentes** (até ${JANELA_CURADORIA} dias) com **ângulos livres**,`,
    'prontas para entrar em futuras edições. Passado esse prazo, a notícia sai',
    'daqui e vai para `nao-tratadas.md`. Evergreens (conteúdo atemporal) não expiram.',
    'Cada ângulo traz o recorte e o impacto Brasil, para você escolher a pauta.',
    '',
  );

  const usavel = (s) => s === 'disponivel' || s === 'parcial';
  let houve = false;

  for (const [slug, nome] of BLOCOS) {
    const itens = pool.itens.filter(
      (i) => i.bloco === slug && usavel(i.status) && fresca(i) && i.angulos.some((a) => a.usado_em === null),
    );
    if (!itens.length) continue;
    houve = true;
    out.push(`## ${nome}`, '');
    for (const i of itens) {
      const flags = [];
      if (i.origem && i.origem !== 'BR') flags.push(i.origem);
      if (i.requer_traducao) flags.push('traduzir');
      const flagTxt = flags.length ? ` · ${flags.join(' · ')}` : '';
      out.push(`### ${i.id} — ${i.titulo}`);
      out.push(`\`${i.tipo} · peso ${i.peso} · ${i.veiculo}${flagTxt}\``, '');
      for (const a of i.angulos.filter((a) => a.usado_em === null)) {
        out.push(`- **${a.id}** — ${a.desc}`);
        if (a.impacto_brasil) out.push(`  - _Impacto Brasil:_ ${a.impacto_brasil}`);
      }
      out.push('');
    }
  }
  if (!houve) out.push('_Nenhuma notícia recente disponível no momento._', '');
  return out.join('\n');
}

// ── nao-tratadas.md ─────────────────────────────────────────────────────────
// Notícias que passaram da janela de 30 dias sem serem esgotadas — saíram do
// banco ativo. Ainda têm ângulos livres, mas exigem decisão: descartar,
// reaproveitar como marco histórico, ou reapurar com dado novo.
function gerarNaoTratadas() {
  const out = ['# Notícias não tratadas (fora da janela)', '', avisoGerado, ''];
  out.push(
    `Notícias com mais de ${JANELA_CURADORIA} dias (por data do fato) que ainda`,
    'têm ângulos livres. Saíram do banco ativo por não serem recentes. Decida:',
    'descartar, usar só como marco histórico, ou reapurar com fato novo.',
    '',
  );
  const foraDoAtivo = (s) => !['quarentena', 'pendente_apuracao', 'esgotada'].includes(s);
  const itens = pool.itens
    .filter((i) => i.data_fato && i.tipo !== 'evergreen' && !fresca(i) && foraDoAtivo(i.status))
    .filter((i) => i.angulos.some((a) => a.usado_em === null))
    .sort((a, b) => diasDesde(b.data_fato) - diasDesde(a.data_fato));

  if (!itens.length) { out.push('_Nenhuma no momento._', ''); return out.join('\n'); }
  for (const i of itens) {
    const livres = i.angulos.filter((a) => a.usado_em === null).length;
    out.push(`- **${i.id}** — ${i.titulo}`);
    out.push(`  - \`${diasDesde(i.data_fato)} dias · ${i.tipo} · status ${i.status} · ${livres} ângulo(s) livre(s) · ${i.veiculo}\``);
  }
  out.push('');
  return out.join('\n');
}

function gerar() {
  fs.mkdirSync(CURADORIA, { recursive: true });
  fs.writeFileSync(path.join(CURADORIA, 'noticias-disponiveis.md'), gerarDisponiveis());
  fs.writeFileSync(path.join(CURADORIA, 'nao-tratadas.md'), gerarNaoTratadas());
  fs.writeFileSync(path.join(CURADORIA, 'noticias-usadas.md'), gerarUsadas());
  fs.writeFileSync(path.join(CURADORIA, 'noticias-por-tipo.md'), gerarPorTipo());
  fs.writeFileSync(path.join(CURADORIA, 'linhas-perfis.md'), gerarLinhas());
}

module.exports = { gerar };

if (require.main === module) {
  gerar();
  console.log('✓ índices de curadoria gerados em curadoria/.');
}
