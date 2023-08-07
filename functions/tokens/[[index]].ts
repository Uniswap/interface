/* eslint-disable import/no-unused-modules */
import { getRequest } from '../utils/getRequest'
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
    return getRequest(res, request.url, () => getToken(networkName, tokenAddress, request.url))
  } catch (e) {
    return res
  }
}
