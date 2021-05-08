import { ContractKit } from '@celo/contractkit'
import {
  AccountAuthResponseSuccess,
  DappKitRequestTypes,
  DappKitResponse,
  DappKitResponseStatus,
  parseDappkitResponseDeeplink,
  SignTxResponseSuccess,
  TxToSignParam,
} from '@celo/utils'
import { requestAccountAddress, requestTxSig } from '@celo-tools/use-contractkit/lib/dappkit-wallet/dappkit'
import { identity } from 'lodash'

const removeQueryParams = (url: string, keys: string[]): string => {
  const params = parseSearchParamsHashAware(url)
  const whereQuery = url.indexOf('?')
  const urlNoSearchParams = whereQuery !== -1 ? url.slice(0, whereQuery) : url
  keys.forEach((key) => {
    params.delete(key)
  })
  if ([...params.keys()].length > 0) {
    return `${urlNoSearchParams}?${params}`
  }
  return url
}

const parseSearchParamsHashAware = (url: string): URLSearchParams => {
  const whereQuery = url.indexOf('?')
  if (whereQuery === -1) {
    return new URLSearchParams()
  }
  const searchNonDeduped = url.slice(whereQuery + 1)
  const allSearch = searchNonDeduped.split('?')
  const newQs = allSearch
    .filter(identity)
    .reduce((acc, qs) => ({ ...acc, ...Object.fromEntries(new URLSearchParams(qs).entries()) }), {})
  return new URLSearchParams(newQs)
}

export const parseDappkitResponseDeeplinkHashAware = (
  url: string
):
  | (DappKitResponse & {
      requestId: string
    })
  | null => {
  const realQs = parseSearchParamsHashAware(url)
  if (!realQs.get('type') || !realQs.get('requestId')) {
    return null
  }
  return parseDappkitResponseDeeplink(`https://fakehost/?${realQs.toString()}`)
}

const localStorageKey = 'ubeswap/dappkit'

// hack to get around deeplinking issue where new tabs are opened
// and the url hash state is not respected (Note this implementation
// of dappkit doesn't use URL hashes to always force the newtab experience).
// don't do this on IOS
if (typeof window !== 'undefined' && !navigator.userAgent.includes('iPhone')) {
  const params = parseSearchParamsHashAware(window.location.href)
  if (params.get('type') && params.get('requestId')) {
    localStorage.setItem(localStorageKey, window.location.href)
    window.close()
  }
}

async function waitForResponse() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // handle redirect
    const params = parseSearchParamsHashAware(window.location.href)
    if (params.get('type') && params.get('requestId')) {
      localStorage.setItem(localStorageKey, window.location.href)
    }

    const value = localStorage.getItem(localStorageKey)
    if (value) {
      localStorage.removeItem(localStorageKey)
      return value
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

async function waitForAccountAuth(requestId: string): Promise<AccountAuthResponseSuccess> {
  const url = await waitForResponse()
  const dappKitResponse = parseDappkitResponseDeeplinkHashAware(url)
  if (!dappKitResponse) {
    throw new Error('no dappkit response')
  }
  if (
    requestId === dappKitResponse.requestId &&
    dappKitResponse.type === DappKitRequestTypes.ACCOUNT_ADDRESS &&
    dappKitResponse.status === DappKitResponseStatus.SUCCESS
  ) {
    return dappKitResponse
  }

  console.warn('Unable to parse url', url)
  throw new Error('Unable to parse Valora response')
}

async function waitForSignedTxs(requestId: string): Promise<SignTxResponseSuccess> {
  const url = await waitForResponse()
  const dappKitResponse = parseDappkitResponseDeeplinkHashAware(url)
  if (!dappKitResponse) {
    throw new Error('no dappkit response')
  }
  if (
    requestId === dappKitResponse.requestId &&
    dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
    dappKitResponse.status === DappKitResponseStatus.SUCCESS
  ) {
    return dappKitResponse
  }

  console.warn('Unable to parse url', url)
  throw new Error('Unable to parse Valora response')
}

const randomString = () => (Math.random() * 100).toString().slice(0, 6)

/**
 * Requests auth from the Valora app.
 */
export const requestValoraAuth = async (): Promise<AccountAuthResponseSuccess> => {
  // clean URL before requesting
  window.location.href = removeQueryParams(window.location.href, [
    'requestId',
    'type',
    'status',
    'address',
    'phoneNumber',
    'pepper',
  ])
  localStorage.removeItem(localStorageKey)
  const requestId = `login-${randomString()}`
  requestAccountAddress({
    requestId,
    dappName: 'Ubeswap',
    callback: window.location.href,
  })
  return await waitForAccountAuth(requestId)
}

/**
 * Requests a transaction from the Valora app.
 */
export const requestValoraTransaction = async (
  kit: ContractKit,
  txs: TxToSignParam[]
): Promise<SignTxResponseSuccess> => {
  window.location.href = removeQueryParams(window.location.href, ['requestId', 'type', 'status', 'rawTxs'])
  localStorage.removeItem(localStorageKey)
  const requestId = `signTransaction-${randomString()}`
  await requestTxSig(kit, txs, {
    requestId,
    dappName: 'Ubeswap',
    callback: window.location.href,
  })
  return await waitForSignedTxs(requestId)
}

export type IValoraAccount = Pick<AccountAuthResponseSuccess, 'address' | 'phoneNumber'>
