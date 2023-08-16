/* eslint-disable import/no-unused-modules */
import getAddress from '../utils/getAddress'
import { getMetadataRequest } from '../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request, next }) => {
  const res = next()
  try {
    const { index } = params
    const address = index?.toString()
    return getMetadataRequest(res, request.url, () => getAddress(address, request.url))
  } catch (e) {
    return res
  }
}
