/* eslint-disable import/no-unused-modules */
import getCollection from '../../utils/getCollection'
import { transformResponse } from '../../utils/transformResponse'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const response = next()
  try {
    const { index } = params
    const collectionAddress = index?.toString()
    return transformResponse(request, await response, () => getCollection(collectionAddress, request.url))
  } catch (e) {
    return response
  }
}
