# Newsletter Alumínio em Perfil

https://www.fromtech.com.br/newsletter/aluminio

Curadoria quinzenal sobre alumínio e manufatura de perfis — escopo global,
lente editorial no impacto para o mercado brasileiro.

**Leitor:** extrusor / fabricante de perfil · fabricante de esquadria /
serralheiro · engenheiro e arquiteto especificador · gestor industrial /
comprador de alumínio.

**Tom:** técnico-editorial — contexto, análise, implicação para o Brasil.

---

## Arquitetura de dados

| Arquivo | Função |
|---|---|
| `data/pool.json` | Todas as notícias e fontes capturadas, com ângulos e impacto Brasil |
| `data/edicoes.json` | Log de edições publicadas — garantia anti-repetição |
| `data/linhas-perfis.json` | Banco de novas linhas de perfil, seção fixa da newsletter |

Nada é apagado do pool. Itens vencidos ficam com `status: "vencida"` para
rastreabilidade histórica.

---

## Os 6 blocos temáticos

| Código | Nome | Paleta |
|---|---|---|
| `mercado_global` | Mercado Global | Grafite `#2B2D33` |
| `tecnologia_prd` | Tecnologia e P&D | Azul aço `#1F4E79` |
| `empresas_operacoes` | Empresas e Operações | Alumínio escovado `#6E7377` |
| `politica_comercial_normas` | Política Comercial e Normas | Bordô `#7A2E2E` |
| `aplicacoes_mercados_fim` | Aplicações e Mercados-Fim | Verde industrial `#2F5D50` |
| `brasil_em_foco` | Brasil em Foco | Dourado âmbar `#B8860B` |

---

## Mix de cada edição (8 itens)

> **Regra fixa: toda edição tem exatamente 8 itens** — 7 notícias + 1 Linha de
> Perfil. Nenhuma edição publica com menos de 8. Se um slot não fecha pelo bloco
> ideal, a reposição preenche; a Linha de Perfil é obrigatória e nunca fica vazia.

| Slot | Qtd | Blocos elegíveis | Janela |
|---|---|---|---|
| Global estratégico | 2 | mercado_global, politica_comercial_normas | 0–120 dias |
| Brasil em Foco | 2 | brasil_em_foco | 0–120 dias |
| Tecnologia / P&D | 1 | tecnologia_prd | 0–365 dias |
| Empresas e Operações | 1 | empresas_operacoes | 0–120 dias |
| Aplicações | 1 | aplicacoes_mercados_fim | 0–365 dias |
| Linha de Perfil | 1 | linhas-perfis.json | — |

**Reposição:** se faltar item num slot, puxar do bloco mais próximo por peso.
Nunca deixar buraco. Evergreens (`data_fato: null`) preenchem slots de
Tecnologia e Aplicações sem prazo de vencimento.

---

## Regra dos ângulos

Cada notícia tem múltiplos **ângulos** — recortes editorialmente distintos
do mesmo fato. Um ângulo com `usado_em` preenchido nunca volta.

Cada ângulo tem dois campos obrigatórios:
- `desc` — o recorte do fato
- `impacto_brasil` — o que isso significa para o leitor daqui

Esse campo força o exercício editorial central da newsletter: não basta
traduzir a notícia global, é preciso aterrissar o impacto.

**Exemplo — NT-016 (antidumping australiano), 4 edições possíveis:**
1. Abertura do caso 700: fato e escopo técnico
2. As NCMs cobertas — as mesmas que entram no Brasil sem barreira
3. EUA + UE + Austrália fechados: Brasil como rota de desvio
4. Resultado da decisão ministerial (apuração futura)

---

## Reaproveitamento de notícia

Uma notícia só reaparece se atender a **uma** dessas condições:
1. Ângulo diferente do já publicado
2. Fato novo ligado a ela (desdobramento, decisão, número atualizado)
3. Mínimo de 2 edições de intervalo desde a última aparição

---

## Status do pool

| Status | Significado |
|---|---|
| `disponivel` | Pronta para uso |
| `parcial` | Alguns ângulos queimados, outros livres |
| `esgotada` | Todos os ângulos publicados |
| `vencida` | Passou da janela sem uso (notícia) |
| `quarentena` | Fonte duvidosa — não publicar sem verificação |
| `pendente_apuracao` | Requer checagem manual antes de entrar |

---

## Tipos de item

| Tipo | Janela de validade |
|---|---|
| `noticia` | 120 dias |
| `analise` | 120 dias |
| `regulatorio` | 120 dias |
| `evergreen` | 365 dias (sem `data_fato`) |
| `artigo_cientifico` | 365 dias |

---

## Fontes globais prioritárias

**Mercado e preços**
- LME (London Metal Exchange) — preço diário oficial
- CRU Group, Wood Mackenzie, Harbor Aluminum — análises de mercado
- World Aluminium (aluminium.org) — dados globais de produção
- USGS Mineral Resources — relatórios de bauxita e alumínio

**Regulação e defesa comercial**
- Global Trade Alert (globaltradealert.org) — medidas tarifárias mundiais
- MDIC / SECEX / SEI — defesa comercial brasileira
- Anti-Dumping Commission (AU), USITC (US), Comissão Europeia (UE)

**Tecnologia e P&D**
- The Aluminum Association (US) — relatórios técnicos
- European Aluminium — roadmap e sustentabilidade
- Materials & Design, Journal of Materials Processing Technology — journals
- ABAL Projeto ELO — demandas de P&D brasileiro

**Setor e empresas**
- Hydro, Novelis, Arconic, Constellium, Norsk Hydro — press releases
- Revista Alumínio (BR), Contramarco (BR), Aluminium Insider (global)
- Light Metal Age (US) — técnico e indústria

**Redes sociais e fontes primárias**
- LinkedIn: ABAL, AFEAL, Hydro, Novelis, European Aluminium
- Instagram: extrusoras brasileiras (ASA, CBA, Tamboré, Tecnoperfil)
- Fesqua (set/2026), Aluminium Düsseldorf (out/2026)

---

## Spec visual — Cartões tipográficos

Cada notícia abre com cartão gerado — sem imagem de terceiros (risco jurídico).

### Anatomia do cartão (proporção 16:9)

```
┌─────────────────────────────────────┐
│  ▍BRASIL EM FOCO                    │  ← tarja 4px + label do bloco
│                                     │
│  Esquadrias crescem 19,8% em 2024  │  ← título, max 3 linhas
│  enquanto construção civil sobe 4%  │
│                                     │
│  AFEAL · Jornal do Brás · 08.04.26 │  ← fonte · veículo · data
│                                     │
│  🇧🇷                                │  ← flag de origem (se diferente do BR)
└─────────────────────────────────────┘
```

Fundo: `#F4F4F2` (off-white industrial)
Título: `#1A1A1A` — Inter Bold 28–32px, line-height 1.15
Label: 11px, caixa alta, letter-spacing 0.12em, peso medium
Metadados: `#767676`, 13px, regular
Tarja lateral: 4px, cor do bloco
Flag de origem: emoji da bandeira, 16px, canto inferior direito
  — aparece sempre que `origem ≠ "BR"` para sinalizar que é material
  traduzido / adaptado

### Paleta completa

| Bloco | Hex | Contraste AA |
|---|---|---|
| Mercado Global | `#2B2D33` | ✓ 14.8:1 |
| Tecnologia e P&D | `#1F4E79` | ✓ 9.2:1 |
| Empresas e Operações | `#6E7377` | ✓ 4.6:1 |
| Política Comercial e Normas | `#7A2E2E` | ✓ 7.1:1 |
| Aplicações e Mercados-Fim | `#2F5D50` | ✓ 8.3:1 |
| Brasil em Foco | `#B8860B` | ✓ 4.7:1 |

Sem sombra, sem gradiente, borda-radius máx 2px.
O setor é industrial — o visual deve ser seco.

---

## Banco de Novas Linhas de Perfil

Seção fixa da newsletter: 1 linha por edição.
Meta de estoque mínimo antes do lançamento: **8 linhas validadas**.
Estoque atual validado: **0** (6 em rascunho).

**Para validar um rascunho**, todos esses campos precisam estar preenchidos:
empresa · linha · tipo · liga_tempera · diferencial_tecnico ·
aplicacao_alvo · fonte · data_confirmada

**Prioridade de validação:**
1. NL-006 (Tamboré / solar) — mercado de maior crescimento
2. NL-004 (Perfil do Brasil / Chroma) — modelo de negócio diferenciado
3. NL-001 (ASA / MEGA) — maior prensa das Américas

---

## Roadmap de apuração

- [ ] Resultado da investigação australiana — Caso 700 (decisão esperada jul/2026)
- [ ] Ler manualmente as 3 notícias da AFEAL (12/06, 11/06, 29/05) — NT-018
- [ ] Validar 6 linhas de perfil em rascunho
- [ ] Atingir estoque mínimo de 8 linhas antes do lançamento
- [ ] Adquirir Anuário ABAL 2025 — dados de capacidade de extrusão
- [ ] Contatar Comitê de Mercado de Extrudados da ABAL
- [ ] Fesqua 09–12/09/2026 — cobertura e recarga do banco de linhas
- [ ] Aluminium Düsseldorf out/2026 — lançamentos globais

## Gaps abertos

1. **Dados de extrusão** — capacidade, volume, número de extrusoras: só existem no Anuário ABAL pago
2. **Vazio regulatório** — Brasil sem medida antidumping em extrudados enquanto EUA, UE e Austrália já se protegem
3. **Aplicações não-construtivas** — automotivo, fotovoltaico, data centers, mobilidade elétrica: sub-representadas no pool
4. **Fontes globais em inglês** — o pool atual é quase todo em português; a abertura de escopo exige captura ativa
