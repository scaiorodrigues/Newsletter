# Curadoria

Índices **gerados automaticamente** para planejar as próximas edições.
Atualizados por `npm run indices` (e a cada `npm run montar:commit`).
Não editar à mão — as mudanças reais vão em `data/*.json`.

| Arquivo | Para quê |
|---|---|
| **[noticias-disponiveis.md](noticias-disponiveis.md)** | Notícias **recentes (até 30 dias)** com ângulos livres — escolha as próximas edições aqui |
| **[linhas-perfis.md](linhas-perfis.md)** | Banco de linhas de perfil para seleção, com o que falta validar |
| [nao-tratadas.md](nao-tratadas.md) | Notícias que **passaram de 30 dias** sem uso — descartar, virar marco histórico ou reapurar |
| [noticias-usadas.md](noticias-usadas.md) | O que já foi publicado (por edição + ângulos queimados) |
| [noticias-por-tipo.md](noticias-por-tipo.md) | Inventário completo do pool, por bloco temático |

**Regra de frescor:** o conteúdo da newsletter deve ser recente. Notícia com
mais de **30 dias** (por data do fato) sai do banco ativo e vai para
`nao-tratadas.md`. Evergreens (conteúdo atemporal) não expiram.

**Fluxo:** escolher pautas em `noticias-disponiveis.md` e a linha em
`linhas-perfis.md` → montar a edição (`npm run montar`) → publicar.
