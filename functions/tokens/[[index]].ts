/* eslint-disable import/no-unused-modules */
import { MetaTagInjector } from '../components/metaTagInjector'
import getToken from '../utils/getToken'

const convertTokenAddress = (tokenAddress: string) => {
  return tokenAddress && tokenAddress === 'NATIVE' ? '0x0000000000000000000000000000000000000000' : tokenAddress
}

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const { index } = params
  const networkName = index[0]?.toString().toUpperCase()
  const tokenAddress = convertTokenAddress(index[1]?.toString())
  if (!tokenAddress) {
    return next()
  }
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
