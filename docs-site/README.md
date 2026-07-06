# docs.hookswap.org — static docs site

`index.html` is a self-contained, Signal/Terminal-themed viewer (Space Grotesk +
IBM Plex Sans/Mono, self-hosted from `fonts/`; brand logo `logo-horizontal.png`)
that renders the repo's `/docs` markdown client-side (via marked.js). It also
ships a built-in **Contracts** page (`#contracts`) whose addresses are inlined
verbatim from `contracts/deployments/*.json`. Deployed to the VPS at
`/var/www/docs.hookswap.org` behind nginx + Let's Encrypt (certbot).

## Deploy / update
1. Copy this `index.html` + `/docs` (as `md/`) + `apps/web/public/favicon.svg` to
   `/var/www/docs.hookswap.org/` (index.html, favicon.svg, md/, vendor/).
2. `curl -fsSL https://cdn.jsdelivr.net/npm/marked@12/marked.min.js -o vendor/marked.min.js`
3. nginx vhost `docs.hookswap.org` → that root; `certbot --nginx -d docs.hookswap.org`.

Live: https://docs.hookswap.org
