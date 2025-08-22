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
    return transformResponse({
      request,
      response: await response,
      data: () => getPool({ networkName, poolAddress, url: request.url }),
    })
  } catch (e) {
    return response
  }
}
