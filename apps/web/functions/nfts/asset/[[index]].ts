/* eslint-disable import/no-unused-modules */
import getAsset from '../../utils/getAsset'
import { getMetadataRequest } from '../../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  try {
    const { index } = params
    const collectionAddress = index[0]?.toString()
    const tokenId = index[1]?.toString()
    return getMetadataRequest(res, request, () => getAsset(collectionAddress, tokenId, request.url))
  } catch (e) {
    return res
  }
}
