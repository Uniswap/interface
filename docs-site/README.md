# docs.hookswap.org — static docs site

`index.html` is a self-contained, Atlas-themed viewer that renders the repo's
`/docs` markdown client-side (via marked.js). Deployed to the VPS at
`/var/www/docs.hookswap.org` behind nginx + Let's Encrypt (certbot).

## Deploy / update
1. Copy this `index.html` + `/docs` (as `md/`) + `apps/web/public/favicon.svg` to
   `/var/www/docs.hookswap.org/` (index.html, favicon.svg, md/, vendor/).
2. `curl -fsSL https://cdn.jsdelivr.net/npm/marked@12/marked.min.js -o vendor/marked.min.js`
3. nginx vhost `docs.hookswap.org` → that root; `certbot --nginx -d docs.hookswap.org`.

Live: https://docs.hookswap.org
