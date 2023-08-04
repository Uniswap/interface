/* eslint-disable import/no-unused-modules */
import getCollection from '../../utils/getCollection'
import getRequest from '../../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  try {
    const { index } = params
    const collectionAddress = index?.toString()
    return getRequest(res, request.url, () => getCollection(collectionAddress, request.url))
  } catch (e) {
    return res
  }
}
