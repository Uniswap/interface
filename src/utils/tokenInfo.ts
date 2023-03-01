import { ChainId, Currency, NativeCurrency, Token, WETH } from '@kyberswap/ks-sdk-core'
import axios from 'axios'

import { KS_SETTING_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import { MAP_TOKEN_HAS_MULTI_BY_NETWORK, WHITE_LIST_TOKEN_INFO_PAIR } from 'constants/tokenLists/token-info'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

/**
 * hard code: ex: usdt => usdt_e, ... if network has multi symbol same name base on network
 * @param network ex: poylgon, ...
 * @param value symbol name, ex: usdt, ...
 * @returns
 */
export const convertSymbol = (network: string, value: string) => {
  const mapData = MAP_TOKEN_HAS_MULTI_BY_NETWORK[network]
  if (mapData) {
    const newValue = mapData[value]
    if (newValue) return newValue
  }
  return value
}

/**
 * check url format /network/sym1-to-sym2, sym1 vs sym2 is in whitelist
 * @param chainId
 * @param symbol1 ex: knc
 * @param symbol2 ex: usdt
 * @returns
 */
export const checkPairInWhiteList = (chainId: ChainId, symbol1: string, symbol2: string) => {
  if (!chainId) {
    return { isInWhiteList: false, data: {}, canonicalUrl: '' }
  }
  const mapByNetwork = WHITE_LIST_TOKEN_INFO_PAIR[chainId]
  const str1 = `${symbol1}-to-${symbol2}`
  const str2 = `${symbol2}-to-${symbol1}`
  const data = mapByNetwork ? mapByNetwork[str1] || mapByNetwork[str2] : null
  const isInWhiteList = !!data

  const pathCanonicalUrl = mapByNetwork && mapByNetwork[str1] ? str1 : str2
  const canonicalUrl = isInWhiteList
    ? `${window.location.protocol}//${window.location.host}/swap/${NETWORKS_INFO[chainId].route}/${pathCanonicalUrl}`
    : ''
  return { isInWhiteList, data: data || {}, canonicalUrl }
}

export const getFormattedAddress = (chainId: ChainId, address?: string, fallback?: string): string => {
  try {
    if (!address) return fallback || ''
    return new Token(chainId, address, 0).address || ''
  } catch (e) {
    return fallback || address || ''
  }
}

export const isTokenNative = (
  currency: Currency | WrappedTokenInfo | undefined,
  chainId: ChainId,
): currency is NativeCurrency => {
  if (currency?.isNative) return true
  // case multichain token
  return chainId
    ? WETH[chainId]?.address === currency?.address &&
        currency instanceof WrappedTokenInfo &&
        currency.multichainInfo?.tokenType === 'NATIVE'
    : false
}

export const importTokensToKsSettings = async (tokens: Array<{ chainId: string; address: string }>) => {
  try {
    await axios.post(`${KS_SETTING_API}/v1/tokens/import`, {
      tokens,
    })
  } catch (e) {
    console.error(e)
  }
}

export const getTokenSymbolWithHardcode = (
  chainId: ChainId | undefined,
  address: string | undefined,
  defaultSymbol: string | undefined,
) => {
  if (
    (chainId === ChainId.OPTIMISM &&
      address?.toLowerCase() === '0x4518231a8fdf6ac553b9bbd51bbb86825b583263'.toLowerCase()) ||
    (chainId === ChainId.ARBITRUM &&
      address?.toLowerCase() === '0x316772cFEc9A3E976FDE42C3Ba21F5A13aAaFf12'.toLowerCase())
  ) {
    return 'mKNC'
  }
  return defaultSymbol ?? ''
}
