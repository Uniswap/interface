/* eslint-disable import/no-unused-modules */
import getRequest from '../utils/getRequest'
import getToken from '../utils/getToken'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  try {
    const { index } = params
    const networkName = index[0]?.toString()
    const tokenAddress = index[1]?.toString()
    if (!tokenAddress) {
      return res
    }
    const graphCall = getToken(networkName, tokenAddress, request.url)
    return getRequest(res, request.url, 'tokens-cache', graphCall)
  } catch (e) {
    return res
  }
}
