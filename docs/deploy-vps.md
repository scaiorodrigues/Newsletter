# Deploy — VPS Hostinger (fromtech.com.br/newsletter)

O hub é publicado como **subpasta** de `fromtech.com.br`, servido pelo nginx do
próprio VPS. O deploy é automático via GitHub Actions.

## Como funciona

1. Push na branch `main` dispara `.github/workflows/deploy.yml`.
2. O Action compila o site com `BASE_PATH=/newsletter` e envia o `dist/` por
   `rsync` para `/var/www/fromtech/newsletter/` no VPS (usuário `deploy`,
   autenticação por chave — secret `DEPLOY_SSH_KEY`).
3. O nginx serve `/newsletter/` a partir dessa pasta.

O `--delete` do rsync fica **confinado a `/var/www/fromtech/newsletter/`** — não
afeta o restante do site em `/var/www/fromtech`.

## Configuração do nginx (feita uma vez, no VPS)

Adicione um `location` ao `server { ... }` de `fromtech.com.br`.

**Se o `root` do server já for `/var/www/fromtech`:**

```nginx
location /newsletter/ {
    try_files $uri $uri/ $uri/index.html =404;
}
```

**Caso o site seja servido de outro diretório (use `alias`):**

```nginx
location /newsletter/ {
    alias /var/www/fromtech/newsletter/;
    index index.html;
    try_files $uri $uri/ $uri/index.html =404;
}

# (opcional) cache longo para os assets versionados do Astro
location /newsletter/_astro/ {
    alias /var/www/fromtech/newsletter/_astro/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

Depois: `sudo nginx -t && sudo systemctl reload nginx`.

## Secret necessário no GitHub

`Settings → Secrets and variables → Actions`:

| Secret | Conteúdo |
|---|---|
| `DEPLOY_SSH_KEY` | Chave **privada** SSH (ed25519) do usuário `deploy` |

Host (`31.97.19.180`), usuário (`deploy`) e diretório
(`/var/www/fromtech/newsletter/`) estão fixos no workflow — se mudarem, edite
`.github/workflows/deploy.yml`.

## Publicar uma nova edição

```bash
npm run montar:commit   # gera content/aluminio/ed-00X.md e atualiza os logs
git add -A && git commit -m "Edição X" && git push
```

Ao chegar na `main`, o deploy roda sozinho e a edição aparece em
`fromtech.com.br/newsletter`.
