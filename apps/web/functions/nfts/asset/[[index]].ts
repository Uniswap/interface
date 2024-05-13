/* eslint-disable import/no-unused-modules */
import getAsset from 'utils/getAsset'
import { transformResponse } from '../../utils/transformResponse'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const response = next()
  try {
    const { index } = params
    const collectionAddress = index[0]?.toString()
    const tokenId = index[1]?.toString()
    return transformResponse(request, await response, () => getAsset(collectionAddress, tokenId, request.url))
  } catch (e) {
    return response
  }
}
