import { ChainId } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'
import { MAP_TOKEN_HAS_MULTI_BY_NETWORK, WHITE_LIST_TOKEN_INFO_PAIR } from 'constants/tokenLists/token-info'

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
export const checkPairInWhiteList = (chainId: ChainId | undefined, symbol1: string, symbol2: string) => {
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
