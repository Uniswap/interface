// Adds global types for functions/
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../index.d.ts" />

/* eslint-disable import/no-unused-modules */
import { paths } from '../src/pages/paths'
import { MetaTagInjector } from './components/metaTagInjector'

function doesMatchPath(path: string): boolean {
  const regexPaths = paths.map((p) => '^' + p.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$')

  return regexPaths.some((regex) => new RegExp(regex).test(path))
}

export const onRequest: PagesFunction = async ({ request, next }) => {
  const requestURL = new URL(request.url)
  const imageUri = requestURL.origin + '/images/1200x630_Rich_Link_Preview_Image.png'
  const data = {
    title: 'Uniswap Interface',
    image: imageUri,
    url: request.url,
    description: 'Swap or provide liquidity on the Uniswap Protocol',
  }
  const res = next()
  if (doesMatchPath(requestURL.pathname)) {
    try {
      return new HTMLRewriter().on('head', new MetaTagInjector(data, request)).transform(await res)
    } catch (e) {
      return res
    }
  }
  return res
}
