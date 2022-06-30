import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { MAP_TOKEN_HAS_MULTI_BY_NETWORK, NETWORKS_INFO } from 'constants/networks'

/**
 * ex:  nguyen hoai danh => nguyen-hoai-danh
 * @param text
 * @returns
 */
export function convertToSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-.]+/g, '')
}

export const getSymbolSlug = (token: Currency | Token | undefined) =>
  token ? convertToSlug(token?.symbol || token?.wrapped?.symbol || '') : ''

export const getNetworkSlug = (chainId: ChainId | undefined) => {
  return chainId ? NETWORKS_INFO[chainId].route : ''
}

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
