/* eslint-disable import/no-unused-modules */
import getToken from '../../utils/getToken'
import { transformResponse } from '../../utils/transformResponse'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const response = next()
  try {
    const { index } = params
    const networkName = index[0]?.toString()
    const tokenAddress = index[1]?.toString()
    if (!tokenAddress) {
      return response
    }
    return transformResponse(request, await response, () => getToken(networkName, tokenAddress, request.url))
  } catch (e) {
    return response
  }
}
