import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'

/**
 * ex:  nguyen hoai danh => nguyen-hoai-danh
 * @param text
 * @returns
 */
export function convertToSlug(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/ +/g, '-')
    .replace(/[^\w-.]+/g, '')
}

export const getSymbolSlug = (token: Currency | Token | undefined) =>
  token ? convertToSlug(token?.symbol || token?.wrapped?.symbol || '') : ''

export const getNetworkSlug = (chainId: ChainId | undefined) => {
  return chainId ? NETWORKS_INFO[chainId].route : ''
}
