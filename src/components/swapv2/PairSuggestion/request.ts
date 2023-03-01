import { ChainId } from '@kyberswap/ks-sdk-core'
import Axios from 'axios'

import { TYPE_AND_SWAP_URL } from 'constants/env'

const formatData = (obj: any) => {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined || obj[key] === '') {
      delete obj[key]
    }
  })
  return obj
}

export type SuggestionPairData = {
  tokenIn: string
  tokenInSymbol: string
  tokenInImgUrl: string
  tokenOut: string
  tokenOutSymbol: string
  tokenOutImgUrl: string
  tokenInName: string
  tokenOutName: string
}

export function reqGetSuggestionPair(
  chainId: ChainId,
  wallet: string | null | undefined,
  query: string,
): Promise<{ favoritePairs: SuggestionPairData[]; recommendedPairs: SuggestionPairData[]; amount: string }> {
  return Axios.get(`${TYPE_AND_SWAP_URL}/v1/suggested-pairs`, { params: formatData({ chainId, query, wallet }) }).then(
    ({ data }) => data.data,
  )
}

export function reqRemoveFavoritePair(
  item: SuggestionPairData,
  wallet: string | null | undefined,
  chainId: ChainId,
): Promise<any> {
  return Axios.delete(`${TYPE_AND_SWAP_URL}/v1/favorite-pairs`, {
    data: { wallet, chainId: chainId + '', tokenIn: item.tokenIn, tokenOut: item.tokenOut },
  })
}

export function reqAddFavoritePair(
  item: SuggestionPairData,
  wallet: string | null | undefined,
  chainId: ChainId,
): Promise<any> {
  return Axios.post(`${TYPE_AND_SWAP_URL}/v1/favorite-pairs`, {
    wallet,
    chainId: chainId + '',
    tokenIn: item.tokenIn,
    tokenOut: item.tokenOut,
  })
}
