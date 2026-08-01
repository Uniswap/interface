# Cloudflare Cloud Functions

## Purpose

These functions utilize Cloudflare Functions to dynamically inject meta tags server-side for richer link sharing capabilities.

Search engines and social media platforms' crawlers read the initial HTML of a page to index and understand its content. These crawlers often do not execute JavaScript, meaning dynamically added client-side content, including metatags, may not be indexed or recognized. This is why we render our metatags on server-side.

However, these server-side injected metatags do not automatically update during client-side navigation managed by react-router. To address this, we implement additional client-side logic - see `src/pages/metatags.ts`. This client-side metatag management is particularly important for compatibility with features like Safari's native share, which relies on metatags like `og:url` to represent the shared page.

## Functions

Currently, there are 2 types of cloudflare functions developed

- Meta Data Injectors - Workers that inject [Open Graph](https://ogp.me/) standardized meta tags into the `header` of specific webpages.
  - Currently we support this functionality for Token Detail Pages, Pool Detail Pages, Position Pages, and Auction Detail Pages
  - These functions query data from GraphQL/Data API and then formats them into HTML `meta` tags to be injected
- Dynamically Generated Images - Utilizes Vercel's [Open Graph Image Generation Library](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation) to create custom thumbnails for specific webpages
  - Currently supports Token Detail Pages, Pool Detail Pages, Position Pages, and Auction Detail Pages
  - These functions query data from GraphQL, and utilize `Satori` to convert HTML into a png image response which is then returned when the api is called.
  - Can be found in the `api/image` folder.

## Testing

Testing is done utilizing a custom vitest environment as well as Cloudflare's local tester: `wrangler`. Wrangler enables testing locally by running a proxy ("Miniflare") to wrap `localhost`. Tests run against a proxy server, so you'll need to start it before running tests:

- Run `bun run dev` to use wrangler and run the Functions code
- Run unit tests with `bun run test:cloud`

TODO(WEB-5914): as of 12/19/24, tests pass locally but fail on CI. Notes on investigation in issue

### Deterministic GraphQL responses (gateway fixtures)

The meta-tag and OG-image tests fetch pages from the dev server, whose worker
queries the interface GraphQL gateway. To keep CI deterministic, the
`cloud-tests` job sets `CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE` to a local
URL: the worker (`functions/client.ts`) sends its queries there, and the vitest
global setup (`functions/fixtures/globalSetup.ts`) serves checked-in responses
from `functions/fixtures/gatewayResponses.ts` on that port.

To run the same way locally, export the override for both processes:

```sh
CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE=http://127.0.0.1:8901/v1/graphql \
  bun run start-server-and-test 'bun run dev' http://localhost:3000/swap 'bun run test:cloud'
```

Without the override, tests exercise the live gateway (old behavior). When
adding a test for a new token/pool, add a matching fixture entry to
`functions/fixtures/gatewayResponses.ts`.

## Deployment

Functions will be deployed to Cloudflare where they will be ran automatically when the appropriate route is hit.

## Miscellaneous

- Caching: In order to speed up webpage requests, repeated GraphQL queries will be saved and pulled using Cloudflare's Cache API.

## Scripts

- `bun run dev` script to start local wrangler environment
  - `wrangler-vite-worker.jsonc` is the Wrangler config file

  ## Additional Documents

  - [Open Graph Protocol](https://ogp.me/)
  - [Open Graph Image Generation](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation)
  - [Cloudflare Workers](https://developers.cloudflare.com/workers/)
  - [HTML Rewriter](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/)
  - [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
