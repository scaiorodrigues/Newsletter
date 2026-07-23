#!/usr/bin/env node
/**
 * regerar-md.cjs — reaplica o formato atual aos markdown de edições já
 * registradas em data/edicoes.json, a partir dos dados do pool.
 * Útil ao mudar o layout (montar-edicao.cjs não reescreve edições antigas).
 *
 * Uso: node scripts/regerar-md.cjs
 */
const fs   = require('fs');
const path = require('path');
const { renderEdicaoMd } = require('./render.cjs');

const ROOT    = path.join(__dirname, '..');
const pool    = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pool.json'), 'utf8'));
const edicoes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'edicoes.json'), 'utf8'));
const linhas  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'linhas-perfis.json'), 'utf8'));

const dir = path.join(ROOT, 'content', 'aluminio');
fs.mkdirSync(dir, { recursive: true });

// postados acumula na ordem cronológica: ao renderizar a edição N, o
// conjunto já contém tudo publicado até N (inclusive) — nunca o futuro.
const postados = new Set();
const ordenadas = [...edicoes.edicoes].sort((a, b) => a.numero - b.numero);

for (const ed of ordenadas) {
  for (const it of ed.itens) postados.add(it.id);
  const md = renderEdicaoMd({
    numero:  ed.numero,
    dataISO: ed.data,
    itens:   ed.itens,
    linhaId: ed.linha_perfil || null,
    pool, linhas,
    postados: new Set(postados),
  });
  const slug = `ed-${String(ed.numero).padStart(3, '0')}`;
  fs.writeFileSync(path.join(dir, `${slug}.md`), md);
  console.log(`✓ regenerado content/aluminio/${slug}.md`);
}
