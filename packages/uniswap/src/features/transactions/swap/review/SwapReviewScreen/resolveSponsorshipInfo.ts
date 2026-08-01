import type { TradingApi } from '@universe/api'
import { isWebApp } from '@universe/environment'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { isSponsorableSwap } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'

/**
 * Returns the sponsorship info to display on the Network cost row, if any.
 * - Wallet-initiated swaps: the Trading API's quote carries it on
 *   `trade.quote.sponsorshipInfo` when the swap is sponsored.
 * - Web-initiated swaps: Uniswap is the only sponsor today, so we fall back
 *   to the Uniswap logo + name whenever the context indicates sponsorship
 *   (paymasterService set, or requestUniswapGasSponsorship === true). No campaign.
 */
export function resolveSponsorshipInfo(swapTxContext: SwapTxAndGasInfo): TradingApi.SponsorshipInfo | undefined {
  if (isSponsorableSwap(swapTxContext)) {
    const sponsorshipInfo = swapTxContext.trade?.quote.sponsorshipInfo
    const sponsor = sponsorshipInfo?.sponsorMetadata
    const hasSponsorMetadata = sponsor && Object.keys(sponsor).length > 0
    // The quote carries the sponsorship. Surface it whenever the swap is
    // sponsored or a campaign is attached — `sponsorMetadata` can be empty when
    // the campaign supplies the branding instead.
    if (sponsorshipInfo?.sponsored || sponsorshipInfo?.campaign || hasSponsorMetadata) {
      return sponsorshipInfo
    }

    if (isWebApp && (swapTxContext.paymasterService || swapTxContext.requestUniswapGasSponsorship)) {
      // On the web app, Uniswap is the only sponsor today
      return {
        sponsored: true,
        sponsorMetadata: {
          name: 'Uniswap Labs',
          icon: UNISWAP_LOGO,
        },
      }
    }
  }

  return undefined
}
