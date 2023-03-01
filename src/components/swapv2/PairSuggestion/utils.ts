import { ChainId } from '@kyberswap/ks-sdk-core'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { TokenMap } from 'hooks/Tokens'
import { getTokenLogoURL } from 'utils'
import { currencyId } from 'utils/currencyId'

import { SuggestionPairData } from './request'

export const isFavoritePair = (favoritePairs: SuggestionPairData[], item: SuggestionPairData) => {
  return favoritePairs.some(({ tokenIn, tokenOut }) => item.tokenIn === tokenIn && item.tokenOut === tokenOut)
}

// address is lowercase
const isTokenInWhiteList = (activeTokens: TokenMap, address: string) =>
  address.toLowerCase() === ETHER_ADDRESS.toLowerCase() ? true : !!activeTokens[address]

// at least tokenIn or tokeOut not in whitelist
export const isActivePair = (activeTokens: TokenMap, pair: SuggestionPairData) =>
  isTokenInWhiteList(activeTokens, pair.tokenIn) && isTokenInWhiteList(activeTokens, pair.tokenOut)

export const findLogoAndSortPair = (activeTokens: TokenMap, list: SuggestionPairData[], chainId: ChainId) => {
  return list
    .map(token => {
      // find logo
      if (!token.tokenInImgUrl) {
        token.tokenInImgUrl = getTokenLogoURL(token.tokenIn, chainId)
      }
      if (!token.tokenOutImgUrl) {
        token.tokenOutImgUrl = getTokenLogoURL(token.tokenOut, chainId)
      }
      return token
    })
    .sort((a, b) => {
      // sort token pair in whitelist appear first
      const activeA = [isTokenInWhiteList(activeTokens, a.tokenIn), isTokenInWhiteList(activeTokens, a.tokenOut)]
      const activeB = [isTokenInWhiteList(activeTokens, b.tokenIn), isTokenInWhiteList(activeTokens, b.tokenOut)]
      return activeA.filter(Boolean).length > activeB.filter(Boolean).length ? -1 : 1
    })
}

export const getAddressParam = (address: string, chainId: ChainId) =>
  address.toLowerCase() === ETHER_ADDRESS.toLowerCase() && chainId
    ? currencyId(NativeCurrencies[chainId], chainId)
    : address
