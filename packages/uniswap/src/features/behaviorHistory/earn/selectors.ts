import type { EarnSwapUpsellTokenHistory } from 'uniswap/src/features/behaviorHistory/earn/swapUpsell'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectEarnSwapUpsellTokenHistory = (
  state: UniswapState,
  tokenCurrencyId: string,
): EarnSwapUpsellTokenHistory | undefined =>
  state.uniswapBehaviorHistory.earnSwapUpsell?.byTokenCurrencyId?.[tokenCurrencyId]
