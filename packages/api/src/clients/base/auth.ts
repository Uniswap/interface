import { ClaimUsernameRequest } from '@uniswap/client-unitag/dist/uniswap/unitag/v1/UnitagService_pb'
import { objectToQueryString } from '@universe/api/src/clients/base/utils'

export const NEW_UNITAGS_SIGNATURE_HEADER = 'x-uni-sig'

export type AuthData = {
  'x-uni-address': Address
  'x-uni-timestamp': number
}

export type SignMessageFunc = (message: string) => Promise<string>
export type SignedRequestParams<T> = {
  data: T
  address: string
  signMessage: SignMessageFunc
}

// These parameters are shared between all write methods in the UnitagService
type UnitagServiceWriteMessageParams = Pick<ClaimUsernameRequest, 'xUniAddress' | 'xUniTimestamp'>

export async function signUnitagServiceMessage<T extends UnitagServiceWriteMessageParams>({
  data,
  address,
  signMessage,
}: SignedRequestParams<T>): Promise<{ data: T; signature: string }> {
  const timestamp = BigInt(Date.now())
  const requestBody = {
    ...data,
    'x-uni-address': address,
    'x-uni-timestamp': timestamp.toString(),
  }
  const message = JSON.stringify(requestBody)
  const signature = await signMessage(message)

  // Proto is camelCase but checks in JSON are done kebab-case
  data.xUniAddress = address
  data.xUniTimestamp = timestamp

  return { data, signature }
}

export async function createSignedRequestBody<T>({
  data,
  address,
  signMessage,
}: SignedRequestParams<T>): Promise<{ requestBody: T & AuthData; signature: string }> {
  const requestBody: T & AuthData = {
    ...data,
    'x-uni-address': address,
    'x-uni-timestamp': Date.now(),
  }
  const message = JSON.stringify(requestBody)
  const signature = await signMessage(message)
  return { requestBody, signature }
}

export async function createSignedRequestParams<T>({
  data,
  address,
  signMessage,
}: SignedRequestParams<T>): Promise<{ requestParams: T & AuthData; signature: string }> {
  const requestParams: T & AuthData = {
    ...data,
    'x-uni-address': address,
    'x-uni-timestamp': Date.now(),
  }
  const message = objectToQueryString(requestParams)
  const signature = await signMessage(message)
  return { requestParams, signature }
}
