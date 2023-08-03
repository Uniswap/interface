/* eslint-disable import/no-unused-modules */
import getCollection from '../../utils/getCollection'
import getRequest from '../../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  try {
    const { index } = params
    const collectionAddress = index?.toString()
    const graphCall = getCollection(collectionAddress, request.url)
    return getRequest(res, request.url, 'collections-cache', graphCall)
  } catch (e) {
    return res
  }
}
