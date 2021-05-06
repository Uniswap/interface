import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  DappKitResponse,
  DappKitResponseStatus,
  parseDappkitResponseDeeplink,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
  TxToSignParam,
} from '@celo/utils'
import { identity, mapValues } from 'lodash'
import * as querystring from 'querystring'

// Gets the url redirected from Valora that is used to update the page
async function waitForValoraResponse() {
  const localStorageKey = 'valoraRedirect'
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const value = localStorage.getItem(localStorageKey)
    if (value) {
      localStorage.removeItem(localStorageKey)
      return value
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

/**
 * Parses the response from Dappkit.
 * @param url
 */
export const parseDappkitResponse = (
  url: string
):
  | (DappKitResponse & {
      requestId: string
    })
  | null => {
  const whereQuery = url.indexOf('?')
  if (whereQuery === -1) {
    return null
  }
  const searchNonDeduped = url.slice(whereQuery + 1)
  const allSearch = searchNonDeduped.split('?')
  const newQs = allSearch.filter(identity).reduce((acc, qs) => ({ ...acc, ...querystring.parse(qs) }), {})
  const realQs = querystring.stringify(newQs)
  const { protocol, host } = new URL(url)
  const result = parseDappkitResponseDeeplink(`${protocol}//${host}/?${realQs}`)
  if (!result.requestId) {
    return null
  }
  return result
}

export const awaitDappkitResponse = async <T extends DappKitResponse>(): Promise<T> => {
  return await new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      console.log('awaiting')
      const url = window.location.href
      try {
        const response = parseDappkitResponse(url)
        if (!response) {
          return
        }
        if (response.status === DappKitResponseStatus.UNAUTHORIZED) {
          reject(new Error('Unauthorized'))
        } else {
          resolve((response as unknown) as T)
        }
        clearInterval(timer)
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }, 200)
  })
}

export const removeQueryParams = (url: string, keys: string[]): string => {
  const whereQuery = url.indexOf('?')
  if (whereQuery === -1) {
    return url
  }
  const searchNonDeduped = url.slice(whereQuery + 1)
  const allSearch = searchNonDeduped.split('?')
  const newQs: Record<string, string> = allSearch.reduce(
    (acc, qs) => ({ ...acc, ...mapValues(querystring.parse(qs), (v) => v?.toString() ?? null) }),
    {}
  )
  keys.forEach((key) => {
    delete newQs[key]
  })
  const { protocol, host, hash } = new URL(url)
  const queryParams = `${querystring.stringify(newQs)}`
  const resultUrl = `${protocol}//${host}/${hash?.slice(0, hash.indexOf('?'))}`
  if (queryParams) {
    return `${resultUrl}?${queryParams}`
  }
  return resultUrl
}

const cleanCallbackUrl = (url: string): string => {
  return removeQueryParams(url, [])
}

/**
 * Requests auth from the Valora app.
 */
export const requestValoraAuth = async (): Promise<AccountAuthResponseSuccess> => {
  const requestId = 'login'
  const dappName = 'Ubeswap'
  const callback = cleanCallbackUrl(window.location.href)
  window.location.href = serializeDappKitRequestDeeplink(
    AccountAuthRequest({
      requestId,
      dappName,
      callback,
    })
  )
  window.location.href = await waitForValoraResponse()
  return await awaitDappkitResponse<AccountAuthResponseSuccess>()
}

/**
 * Requests auth from the Valora app.
 */
export const requestValoraTransaction = async (txs: TxToSignParam[]): Promise<SignTxResponseSuccess> => {
  const requestId = 'make-transaction'
  const dappName = 'Ubeswap'
  const callback = cleanCallbackUrl(window.location.href)
  window.location.href = serializeDappKitRequestDeeplink(
    SignTxRequest(txs, {
      requestId,
      dappName,
      callback,
    })
  )
  window.location.href = await waitForValoraResponse()
  return await awaitDappkitResponse<SignTxResponseSuccess>()
}

export type IValoraAccount = Pick<AccountAuthResponseSuccess, 'address' | 'phoneNumber'>
