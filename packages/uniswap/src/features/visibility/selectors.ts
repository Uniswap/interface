import {
  ActivityIdToVisibility,
  CurrencyIdToVisibility,
  NFTKeyToVisibility,
  PositionKeyToVisibility,
} from 'uniswap/src/features/visibility/slice'
import { UniswapRootState } from 'uniswap/src/state'

export const selectPositionsVisibility = (state: UniswapRootState): PositionKeyToVisibility =>
  state.visibility.positions

export const selectTokensVisibility = (state: UniswapRootState): CurrencyIdToVisibility => state.visibility.tokens

export const selectNftsVisibility = (state: UniswapRootState): NFTKeyToVisibility => state.visibility.nfts

export const selectActivityVisibility = (state: UniswapRootState): ActivityIdToVisibility => state.visibility.activity
