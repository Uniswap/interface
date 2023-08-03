/* eslint-disable import/no-unused-modules */
import getAsset from '../../utils/getAsset'
import getRequest from '../../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  try {
    const { index } = params
    const collectionAddress = index[0]?.toString()
    const tokenId = index[1]?.toString()
    const graphCall = getAsset(collectionAddress, tokenId, request.url)
    return getRequest(res, request.url, 'assets-cache', graphCall)
  } catch (e) {
    return res
  }
}
