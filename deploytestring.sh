yarn && yarn g:prepare && yarn web build:development
npx wrangler pages deploy apps/web/build --project-name new-interface --branch ring_main

