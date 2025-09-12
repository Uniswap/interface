# Cloudflare Cloud Functions

## Purpose

These functions utilize Cloudflare Functions to dynamically inject meta tags server-side for richer link sharing capabilities.

Search engines and social media platforms' crawlers read the initial HTML of a page to index and understand its content. These crawlers often do not execute JavaScript, meaning dynamically added client-side content, including metatags, may not be indexed or recognized. This is why we render our metatags on server-side.

However, these server-side injected metatags do not automatically update during client-side navigation managed by react-router. To address this, we implement additional client-side logic - see `src/pages/metatags.ts`. This client-side metatag management is particularly important for compatibility with features like Safari's native share, which relies on metatags like `og:url` to represent the shared page.

## Functions

Currently, there are 2 types of cloudflare functions developed

- Meta Data Injectors - Workers that inject [Open Graph](https://ogp.me/) standardized meta tags into the `header` of specific webpages.
  - Currently we support this functionality for two separate webpages: Token Detail Pages & Pool Detail Pages
  - These functions query data from GraphQL and then formats them into HTML `meta` tags to be injected
- Dynamically Generated Images - Utilizes Vercel's [Open Graph Image Generation Library](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation) to create custom thumbnails for specific webpages
  - Currently supports Token Detail Pages & Pool Detail Pages
  - These functions query data from GraphQL, and utilize `Satori` to convert HTML into a png image response which is then returned when the api is called.
  - Can be found in the `api/image` folder.

## Testing

Testing is done utilizing a custom jest environment as well as Cloudflare's local tester: `wrangler`. Wrangler enables testing locally by running a proxy ("Miniflare") to wrap `localhost`. Tests run against a proxy server, so you'll need to start it before running tests:

- Run `bun run dev` to use wrangler and run the Functions code
- Run unit tests with `bun run test:cloud`

TODO(WEB-5914): as of 12/19/24, tests pass locally but fail on CI. Notes on investigation in issue

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
