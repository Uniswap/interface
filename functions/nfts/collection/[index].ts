/* eslint-disable import/no-unused-modules */
import getCollection from '../../utils/getCollection'
import { getMetadataRequest } from '../../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  try {
    const { index } = params
    const collectionAddress = index?.toString()
    return getMetadataRequest(res, request, () => getCollection(collectionAddress, request.url))
  } catch (e) {
    return res
  }
}
