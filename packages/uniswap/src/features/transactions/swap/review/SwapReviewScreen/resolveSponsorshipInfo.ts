import type { TradingApi } from '@universe/api'
import { isSponsorableSwap } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { getDisplayableSponsorshipInfo } from 'uniswap/src/features/transactions/swap/utils/routing'

/**
 * Returns the sponsorship info to display on the Network cost row, if any.
 *
 * Only a quote the Trading API marked `sponsored` is shown as sponsored. A campaign, `sponsorMetadata`
 * or a paymaster capability alone does not make the swap free: execution only uses the paymaster for a
 * sponsored quote, so anything else would show "Free" for a swap that charges gas.
 */
export function resolveSponsorshipInfo(swapTxContext: SwapTxAndGasInfo): TradingApi.SponsorshipInfo | undefined {
  if (!isSponsorableSwap(swapTxContext)) {
    return undefined
  }

  return getDisplayableSponsorshipInfo(swapTxContext.trade?.quote.sponsorshipInfo)
}
