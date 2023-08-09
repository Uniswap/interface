/* eslint-disable import/no-unused-modules */
import { Chain } from '../../src/graphql/data/__generated__/types-and-hooks'
import getRequest from '../utils/getRequest'
import getToken from '../utils/getToken'

const convertTokenAddress = (tokenAddress: string, networkName: string) => {
  if (tokenAddress === 'NATIVE') {
    switch (networkName) {
      case Chain.Celo:
        return '0x471EcE3750Da237f93B8E339c536989b8978a438'
      case Chain.Polygon:
        return '0x0000000000000000000000000000000000001010'
      default:
        return undefined
    }
  }
  return tokenAddress
}

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  try {
    const { index } = params
    const networkName = index[0]?.toString().toUpperCase()
    const tokenString = index[1]?.toString()
    if (!tokenString) {
      return res
    }
    const tokenAddress = convertTokenAddress(tokenString, networkName)
    return getRequest(res, request.url, () => getToken(networkName, tokenAddress, request.url))
  } catch (e) {
    return res
  }
}
