# Curadoria

Índices **gerados automaticamente** para planejar as próximas edições.
Atualizados por `npm run indices` (e a cada `npm run montar:commit`).
Não editar à mão — as mudanças reais vão em `data/*.json`.

| Arquivo | Para quê |
|---|---|
| **[noticias-disponiveis.md](noticias-disponiveis.md)** | Notícias com ângulos livres, prontas para as **próximas edições** — escolha aqui |
| **[linhas-perfis.md](linhas-perfis.md)** | Banco de linhas de perfil para seleção, com o que falta validar |
| [noticias-usadas.md](noticias-usadas.md) | O que já foi publicado (por edição + ângulos queimados) |
| [noticias-por-tipo.md](noticias-por-tipo.md) | Inventário completo do pool, por bloco temático |

**Fluxo:** escolher pautas em `noticias-disponiveis.md` e a linha em
`linhas-perfis.md` → montar a edição (`npm run montar`) → publicar.
