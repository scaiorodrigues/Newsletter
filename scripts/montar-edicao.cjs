#!/usr/bin/env node
/**
 * montar-edicao.js — v2
 * Sugere os 8 itens da próxima edição aplicando o mix por bloco.
 * Uso: node scripts/montar-edicao.js [--commit]
 *
 * Sem --commit: imprime sugestão para revisão editorial.
 * Com --commit: marca ângulos, grava log e cria o markdown da edição.
 *
 * A seleção é uma SUGESTÃO. A decisão final é humana.
 */

const fs   = require('fs');
const path = require('path');
const { renderEdicaoMd, relacaoTexto } = require('./render.cjs');

const ROOT   = path.join(__dirname, '..');
const POOL   = path.join(ROOT, 'data', 'pool.json');
const EDICOES= path.join(ROOT, 'data', 'edicoes.json');
const LINHAS = path.join(ROOT, 'data', 'linhas-perfis.json');
const COMMIT = process.argv.includes('--commit');

const pool   = JSON.parse(fs.readFileSync(POOL,    'utf8'));
const edicoes= JSON.parse(fs.readFileSync(EDICOES, 'utf8'));
const linhas = JSON.parse(fs.readFileSync(LINHAS,  'utf8'));

const hoje     = new Date();
const diasDesde= (d) => (d ? Math.floor((hoje - new Date(d)) / 864e5) : null);
const numero   = edicoes.edicoes.length + 1;
const MIX      = edicoes._meta.mix;
const INTERVALO= edicoes._meta.intervalo_minimo_reaparicao;
const PESO     = { alta: 3, media: 2, baixa: 1 };

const JANELA = { noticia: 120, analise: 120, regulatorio: 120, evergreen: 365, artigo_cientifico: 365 };

// Última edição em que cada item apareceu
const ultimaAparicao = {};
for (const ed of edicoes.edicoes)
  for (const it of ed.itens) ultimaAparicao[it.id] = ed.numero;

function candidatosPorBlocos(blocos, maxDias) {
  const out = [];
  for (const item of pool.itens) {
    if (['quarentena','pendente_apuracao','esgotada','vencida'].includes(item.status)) continue;
    if (blocos && !blocos.includes(item.bloco)) continue;

    const ultima = ultimaAparicao[item.id];
    if (ultima !== undefined && numero - ultima < INTERVALO) continue;

    const janela = JANELA[item.tipo] || 120;
    const idade  = diasDesde(item.data_fato);

    // Evergreens e itens sem data entram em qualquer slot
    if (idade !== null && (idade > Math.min(janela, maxDias || janela))) continue;

    for (const ang of item.angulos) {
      if (ang.usado_em === null)
        out.push({ item, ang, idade });
    }
  }
  return out.sort((a,b) => PESO[b.item.peso] - PESO[a.item.peso]);
}

const selecao    = [];
const itensUsados= new Set();
const blocosUsados = {};

function escolher(slotNome, n, blocos, maxDias) {
  const candidatos = candidatosPorBlocos(blocos, maxDias);
  let posto = 0;
  for (const c of candidatos) {
    if (posto >= n) break;
    if (itensUsados.has(c.item.id)) continue;
    // Máx 2 ângulos do mesmo bloco por edição
    if ((blocosUsados[c.item.bloco] || 0) >= 2) continue;

    selecao.push({
      slot:   slotNome,
      id:     c.item.id,
      angulo: c.ang.id,
      titulo: c.item.titulo,
      bloco:  c.item.bloco,
      veiculo:c.item.veiculo,
      origem: c.item.origem,
      idioma: c.item.idioma_original,
      trad:   c.item.requer_traducao,
      idade:  c.idade,
      desc:   c.ang.desc,
      impacto:c.ang.impacto_brasil,
      peso:   c.item.peso,
      comentario: c.item.comentario_editorial
    });
    itensUsados.add(c.item.id);
    blocosUsados[c.item.bloco] = (blocosUsados[c.item.bloco] || 0) + 1;
    posto++;
  }
  return posto;
}

// Preenche cada slot do mix
for (const [slot, cfg] of Object.entries(MIX)) {
  if (slot === 'linha_perfil') continue;
  const obtidos = escolher(slot, cfg.qtd, cfg.blocos, cfg.janela_dias?.[1]);
  // Se faltar, reposição sem restrição de bloco
  if (obtidos < cfg.qtd)
    escolher(slot + '_reposicao', cfg.qtd - obtidos, null, 120);
}

// Slot da linha de perfil
const linhaDisp     = linhas.linhas.find(l => l.validado && l.edicao === null);
const linhaFallback = linhas.linhas.find(l => l.status === 'rascunho');

// ─── Exibição ───────────────────────────────────────────────────────────────

const LABEL = {
  global_estrategico:           'GLOBAL ESTRATÉGICO',
  global_estrategico_reposicao: 'GLOBAL (REPOSIÇÃO)',
  brasil_em_foco:               'BRASIL EM FOCO',
  brasil_em_foco_reposicao:     'BRASIL (REPOSIÇÃO)',
  tecnologia_prd:               'TECNOLOGIA / P&D',
  tecnologia_prd_reposicao:     'TECNOLOGIA (REPOSIÇÃO)',
  empresas_operacoes:           'EMPRESAS E OPERAÇÕES',
  empresas_operacoes_reposicao: 'OPERAÇÕES (REPOSIÇÃO)',
  aplicacoes:                   'APLICAÇÕES',
  aplicacoes_reposicao:         'APLICAÇÕES (REPOSIÇÃO)',
};

// Conjunto de itens já publicados (edições anteriores + esta) — base do
// campo "Relação". Definido aqui para servir tanto à prévia quanto ao md.
const postados = new Set();
for (const ed of edicoes.edicoes) for (const it of ed.itens) postados.add(it.id);
for (const s of selecao) postados.add(s.id);

const semMarkup = (t) => t.replace(/\*\*/g, '').replace(/\*/g, '');

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(` Edição ${numero} — sugestão de pauta  `);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

for (const s of selecao) {
  const idade  = s.idade === null ? 'perene' : `${s.idade}d`;
  const flag   = s.trad ? ` 🌐 traduzir (${s.idioma?.toUpperCase()})` : '';
  const origem = s.origem !== 'BR' ? ` [${s.origem}]` : '';
  const item   = pool.itens.find(i => i.id === s.id);
  const rel    = relacaoTexto(item, pool, postados);
  console.log(`[${LABEL[s.slot] || s.slot}]`);
  console.log(`  ${s.id}/${s.angulo} · ${idade} · ${s.bloco}${origem}${flag}`);
  console.log(`  Título:  ${s.titulo}`);
  console.log(`  Ângulo:  ${s.desc}`);
  console.log(`  BR:      ${s.impacto}`);
  console.log(`  Veículo: ${s.veiculo}`);
  if (rel)          console.log(`  Relação: ${semMarkup(rel)}`);
  // Prévia de validação — NÃO vai para a página publicada.
  if (s.comentario) console.log(`  📝 Nota (só validação): ${s.comentario}`);
  console.log('');
}

console.log(`[LINHA DE PERFIL]`);
if (linhaDisp) {
  console.log(`  ${linhaDisp.id} — ${linhaDisp.empresa}: ${linhaDisp.linha}`);
  console.log(`  ${linhaDisp.angulo_editorial}\n`);
} else if (linhaFallback) {
  console.log(`  ⚠ Nenhuma VALIDADA. Candidata: ${linhaFallback.id} — ${linhaFallback.empresa}`);
  console.log(`  → Validar antes de publicar. Estoque atual: 0/${linhas._meta.meta_estoque_minimo}\n`);
} else {
  console.log(`  ⚠ Banco de linhas vazio.\n`);
}

const totalSel = selecao.length + (linhaDisp ? 1 : 0);
const reposicoes = selecao.filter(s => s.slot.includes('reposicao')).length;
if (totalSel < 8) console.log(`⚠ Apenas ${totalSel}/8 slots preenchidos. Pool precisa reforço.\n`);
if (reposicoes)   console.log(`⚠ ${reposicoes} slot(s) preenchidos por reposição — mix ideal não atingido.\n`);
if (!COMMIT) { console.log('Sugestão apenas. Rode com --commit para gravar.\n'); process.exit(0); }

// ─── Commit ──────────────────────────────────────────────────────────────────

for (const s of selecao) {
  const item = pool.itens.find(i => i.id === s.id);
  item.angulos.find(a => a.id === s.angulo).usado_em = numero;
  const usados = item.angulos.filter(a => a.usado_em !== null).length;
  if (usados === item.angulos.length) item.status = 'esgotada';
  else if (usados > 0) item.status = 'parcial';
}
if (linhaDisp) { linhaDisp.edicao = numero; }

edicoes.edicoes.push({
  numero,
  data:        hoje.toISOString().slice(0,10),
  itens:       selecao.map(s => ({ id: s.id, angulo: s.angulo, slot: s.slot })),
  linha_perfil:linhaDisp ? linhaDisp.id : null
});

fs.writeFileSync(POOL,    JSON.stringify(pool,    null, 2) + '\n');
fs.writeFileSync(EDICOES, JSON.stringify(edicoes, null, 2) + '\n');
fs.writeFileSync(LINHAS,  JSON.stringify(linhas,  null, 2) + '\n');

// Markdown da edição — namespaced por newsletter (esta é "aluminio")
const dir  = path.join(ROOT, 'content', 'aluminio');
fs.mkdirSync(dir, { recursive: true });
const slug = `ed-${String(numero).padStart(3,'0')}`;

const md = renderEdicaoMd({
  numero,
  dataISO: hoje.toISOString().slice(0, 10),
  itens:   selecao.map(s => ({ id: s.id, angulo: s.angulo, slot: s.slot })),
  linhaId: linhaDisp ? linhaDisp.id : null,
  pool, linhas, postados
});

fs.writeFileSync(path.join(dir, `${slug}.md`), md);
console.log(`✓ Gravado. content/aluminio/${slug}.md criado.\n`);

// Atualiza os índices (notícias usadas / por tipo)
require('./indices.cjs').gerar();
console.log('✓ Índices atualizados (noticias-usadas.md, noticias-por-tipo.md).\n');
