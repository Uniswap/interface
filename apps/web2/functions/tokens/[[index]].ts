/* eslint-disable import/no-unused-modules */
import { getMetadataRequest } from '../utils/getRequest'
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
    return getMetadataRequest(res, request, () => getToken(networkName, tokenAddress, request.url))
  } catch (e) {
    return res
  }
}
