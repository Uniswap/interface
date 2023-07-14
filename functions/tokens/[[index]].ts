/* eslint-disable import/no-unused-modules */
import { PagesFunction } from '@cloudflare/workers-types'

import { MetaTagInjector } from '../components/metaTagInjector'
import getToken from '../utils/getToken'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const networkName = String(index[0]).toUpperCase()
  let tokenAddress = String(index[1])
  tokenAddress =
    tokenAddress !== 'undefined' && tokenAddress === 'NATIVE'
      ? '0x0000000000000000000000000000000000000000'
      : tokenAddress
  const tokenPromise = getToken(networkName, tokenAddress, request.url)
  const resPromise = next()
  try {
    const [data, res] = await Promise.all([tokenPromise, resPromise])
    if (!data) {
      return resPromise
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(res)
  } catch (e) {
    return resPromise
  }
}
