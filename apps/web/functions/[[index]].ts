// Adds global types for functions/
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../index.d.ts" />

import { paths } from '../src/pages/paths'
import { addSecurityHeaders } from './utils/securityHeaders'
import { transformResponse } from './utils/transformResponse'

function doesMatchPath(path: string): boolean {
  const regexPaths = paths.map((p) => '^' + p.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$')

  // eslint-disable-next-line security/detect-non-literal-regexp
  return regexPaths.some((regex) => new RegExp(regex).test(path))
}

export const onRequest: PagesFunction = async ({ request, next }) => {
  const requestURL = new URL(request.url)
  const imageUri = requestURL.origin + '/images/1200x630_Rich_Link_Preview_Image.png'
  const data = {
    title: 'Ring Interface',
    image: imageUri,
    url: request.url,
    description:
      'Swap crypto on Ethereum, Base, Arbitrum, Polygon, Unichain and more. The DeFi platform trusted by millions.',
  }

  const upstream = await next()
  let result: Response = upstream

  if (doesMatchPath(requestURL.pathname)) {
    try {
      result = await transformResponse(request, upstream, data)
    } catch (e) {
      result = upstream
    }
  }

  return addSecurityHeaders(result)
}
