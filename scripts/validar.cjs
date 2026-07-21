#!/usr/bin/env node
/**
 * validar.js — v2
 * Checa integridade do pool, marca vencidos e imprime relatório de saúde.
 * Uso: node scripts/validar.js [--fix]
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const POOL   = path.join(ROOT, 'data', 'pool.json');
const EDICOES= path.join(ROOT, 'data', 'edicoes.json');
const LINHAS = path.join(ROOT, 'data', 'linhas-perfis.json');
const FIX    = process.argv.includes('--fix');

const pool   = JSON.parse(fs.readFileSync(POOL,    'utf8'));
const edicoes= JSON.parse(fs.readFileSync(EDICOES, 'utf8'));
const linhas = JSON.parse(fs.readFileSync(LINHAS,  'utf8'));

const hoje     = new Date();
const diasDesde= (d) => Math.floor((hoje - new Date(d)) / 864e5);

const JANELA = { noticia: 120, analise: 120, regulatorio: 120, evergreen: 365, artigo_cientifico: 365 };

const avisos = [];
const erros  = [];
let   alterados = 0;

// IDs duplicados
const ids = pool.itens.map(i => i.id);
ids.filter((id, n) => ids.indexOf(id) !== n)
   .forEach(id => erros.push(`ID duplicado no pool: ${id}`));

// Consistência: ângulos marcados precisam constar no log
const edicoesRegistradas = new Set(edicoes.edicoes.map(e => e.numero));

for (const item of pool.itens) {
  if (!item.angulos?.length) {
    erros.push(`${item.id}: sem ângulos`);
    continue;
  }

  const janela  = JANELA[item.tipo] || 120;
  const total   = item.angulos.length;
  const usados  = item.angulos.filter(a => a.usado_em !== null).length;
  const livres  = total - usados;

  // Validade — só para itens com data_fato
  if (item.data_fato) {
    const idade = diasDesde(item.data_fato);
    if (idade > janela && livres > 0 && item.status === 'disponivel') {
      avisos.push(`${item.id}: ${idade}d (janela ${janela}d), ${livres} ângulo(s) nunca usados → vencida`);
      if (FIX) { item.status = 'vencida'; alterados++; }
    }
  }

  // Esgotamento e parcial
  if (usados === total && item.status !== 'esgotada' && item.status !== 'vencida') {
    avisos.push(`${item.id}: todos os ${total} ângulos usados → esgotada`);
    if (FIX) { item.status = 'esgotada'; alterados++; }
  } else if (usados > 0 && livres > 0 && item.status === 'disponivel') {
    if (FIX) { item.status = 'parcial'; alterados++; }
  }

  // Alertas editoriais
  if (item.status === 'quarentena')
    avisos.push(`${item.id}: EM QUARENTENA — não publicar sem verificar`);
  if (item.status === 'pendente_apuracao')
    avisos.push(`${item.id}: PENDENTE APURAÇÃO`);
  if (item.requer_traducao && !item.texto_editado)
    avisos.push(`${item.id}: requer tradução, texto ainda não editado`);
  if (item.peso === 'alta' && !item.texto_editado)
    avisos.push(`${item.id}: peso ALTA sem texto editado`);

  // Ângulos apontando para edições inexistentes
  for (const ang of item.angulos) {
    if (ang.usado_em !== null && !edicoesRegistradas.has(ang.usado_em))
      erros.push(`${item.id}/${ang.id}: aponta para edição ${ang.usado_em}, ausente do log`);
    if (!ang.impacto_brasil)
      avisos.push(`${item.id}/${ang.id}: sem impacto_brasil`);
  }
}

// Relatório do banco de linhas
const linhasValidadas = linhas.linhas.filter(l => l.validado).length;
const linhasRascunho  = linhas.linhas.filter(l => l.status === 'rascunho').length;
const metaLinhas      = linhas._meta.meta_estoque_minimo;

// Autonomia do pool
const SLOTS_NOTICIA = 7; // 8 itens menos 1 do banco de linhas
const disponiveis   = pool.itens.filter(i => ['disponivel','parcial'].includes(i.status));
const angulosLivres = disponiveis.reduce((s,i) => s + i.angulos.filter(a => a.uso_em === null).length, 0);

// Corrige: conta ângulos usados_em === null
const angulosLivresReal = disponiveis.reduce(
  (s,i) => s + i.angulos.filter(a => a.usado_em === null).length, 0
);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' Validação — Newsletter Alumínio   ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`Pool total:            ${pool.itens.length} itens`);
console.log(`Disponíveis / parciais:${disponiveis.length} itens`);
console.log(`Ângulos livres:        ${angulosLivresReal}`);
console.log(`Autonomia estimada:    ~${Math.floor(angulosLivresReal / SLOTS_NOTICIA)} edições`);
console.log(`\nBanco de linhas:       ${linhasValidadas} validadas / ${linhasRascunho} rascunhos`);
const pct = Math.round(linhasValidadas / metaLinhas * 100);
console.log(`Estoque mínimo (${metaLinhas}):   ${pct}% atingido ${linhasValidadas >= metaLinhas ? '✓' : '⚠'}\n`);

if (erros.length) {
  console.log('ERROS ─────────────────────────────');
  erros.forEach(e => console.log(`  ✗ ${e}`));
  console.log('');
}
if (avisos.length) {
  console.log('AVISOS ────────────────────────────');
  avisos.forEach(a => console.log(`  · ${a}`));
  console.log('');
}
if (!erros.length && !avisos.length) {
  console.log('Tudo em ordem.\n');
}

if (FIX && alterados) {
  pool._meta.atualizado_em = hoje.toISOString().slice(0,10);
  fs.writeFileSync(POOL, JSON.stringify(pool, null, 2) + '\n');
  console.log(`${alterados} status atualizados no pool.\n`);
}

process.exit(erros.length ? 1 : 0);
