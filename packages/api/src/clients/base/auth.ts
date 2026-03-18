import { objectToQueryString } from '@universe/api/src/clients/base/utils'

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
