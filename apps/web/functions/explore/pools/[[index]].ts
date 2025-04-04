/* eslint-disable import/no-unused-modules */
import getPool from 'utils/getPool'
import { transformResponse } from '../../utils/transformResponse'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const response = next()
  try {
    const { index } = params
    const networkName = index[0]?.toString()
    const poolAddress = index[1]?.toString()
    if (!poolAddress) {
      return response
    }
    return transformResponse(request, await response, () => getPool(networkName, poolAddress, request.url))
  } catch (e) {
    return response
  }
}
