# Server Functions

## Purpose

A Hono app (`app.ts`, `createApp`) that dynamically injects meta tags server-side for richer link sharing capabilities, serves OG images, and proxies the BFF routes (`/entry-gateway`, `/config`).

Search engines and social media platforms' crawlers read the initial HTML of a page to index and understand its content. These crawlers often do not execute JavaScript, meaning dynamically added client-side content, including metatags, may not be indexed or recognized. This is why we render our metatags on server-side.

However, these server-side injected metatags do not automatically update during client-side navigation managed by react-router. To address this, we implement additional client-side logic - see `src/pages/metatags.ts`. This client-side metatag management is particularly important for compatibility with features like Safari's native share, which relies on metatags like `og:url` to represent the shared page.

## Functions

Currently, there are 2 types of functions developed

- Meta Data Injectors - Middleware that injects [Open Graph](https://ogp.me/) standardized meta tags into the `header` of specific webpages.
  - Currently we support this functionality for Token Detail Pages, Pool Detail Pages, Position Pages, and Auction Detail Pages
  - These functions query data from GraphQL/Data API and then formats them into HTML `meta` tags to be injected
- Dynamically Generated Images - Utilizes Vercel's [Open Graph Image Generation Library](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation) to create custom thumbnails for specific webpages
  - Currently supports Token Detail Pages, Pool Detail Pages, Position Pages, and Auction Detail Pages
  - These functions query data from GraphQL, and utilize `Satori` to convert HTML into a png image response which is then returned when the api is called.
  - Can be found in the `api/image` folder.

## Entry points

Each entry point supplies the platform-specific pieces `createApp` needs (SPA HTML, upstream URLs, trusted client IP):

- `ecs-entry.ts` — production (AWS ECS, Node), bundled to `build/server/index.mjs` by `vite.server.config.mts`
- `vercel-entry.ts` — Vercel previews, bundled by the same config
- `dev-entry.ts` — `bun run dev`: `vite/honoDevServerPlugin.ts` mounts it behind the Vite dev server, serving `index.html` through Vite's HTML transform. Vite's own proxy answers `/config`, `/ws` and (with `ENABLE_ENTRY_GATEWAY_PROXY=true`) `/entry-gateway` before the Hono app sees them.

## Testing

Testing is done utilizing a custom vitest environment. The meta-tag and OG-image tests fetch pages from the dev server, so you'll need to start it before running tests:

- Run `bun run dev` to serve the functions code on localhost:3000
- Run unit tests with `bun run test:cloud`

TODO(WEB-5914): as of 12/19/24, tests pass locally but fail on CI. Notes on investigation in issue

### Deterministic gateway responses (gateway fixtures)

The meta-tag and OG-image tests fetch pages from the dev server, whose Hono app
queries the data-api and liquidity backends. To keep CI deterministic, the
`cloud-tests` job sets `CLOUD_FUNCTIONS_DATA_API_ENDPOINT_OVERRIDE` and
`CLOUD_FUNCTIONS_LIQUIDITY_ENDPOINT_OVERRIDE` to a local URL: the server
(`functions/utils/dataApiService.ts`, `functions/utils/liquidityService.ts`) sends
its requests there, and the vitest global setup (`functions/fixtures/globalSetup.ts`)
serves checked-in responses from `functions/fixtures/gatewayResponses.ts` on that port.

To run the same way locally, export the overrides for both processes:

```sh
CLOUD_FUNCTIONS_DATA_API_ENDPOINT_OVERRIDE=http://127.0.0.1:8901 \
CLOUD_FUNCTIONS_LIQUIDITY_ENDPOINT_OVERRIDE=http://127.0.0.1:8901 \
  bun run start-server-and-test 'bun run dev' http://localhost:3000/swap 'bun run test:cloud'
```

Without the overrides, tests exercise the live gateways (old behavior). When
adding a test for a new token/pool, add a matching fixture entry to
`functions/fixtures/gatewayResponses.ts`.

## Deployment

The app is deployed to AWS ECS as part of the web image (`apps/web/Dockerfile`, `bun web build:ecs`).

## Miscellaneous

- Caching: In order to speed up webpage requests, repeated GraphQL queries are cached in a process-local map (`utils/cache.ts`).

## Additional Documents

- [Open Graph Protocol](https://ogp.me/)
- [Open Graph Image Generation](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation)
- [Hono](https://hono.dev/)
