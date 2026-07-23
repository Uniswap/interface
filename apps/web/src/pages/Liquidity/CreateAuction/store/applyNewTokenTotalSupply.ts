import { type Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import {
  buildAuctionAmountsFromLiquidityPreview,
  updateCommittedPostAuctionLiquidity,
} from '~/pages/Liquidity/CreateAuction/store/postAuctionLiquidityAllocationState'
import { type CreateAuctionStoreState, TokenMode } from '~/pages/Liquidity/CreateAuction/types'
import { getPostAuctionLiquidityPreviewPercent } from '~/pages/Liquidity/CreateAuction/utils'

/**
 * New-token-only store updater: sets a custom total supply and rebuilds the committed auction
 * amounts on the committed currency, preserving the user's deposit fraction of supply. Returns an
 * empty patch for existing tokens or before the token form is committed. LP-960.
 */
export function applyNewTokenTotalSupply(totalSupply: CurrencyAmount<Currency>) {
  return (state: CreateAuctionStoreState): Partial<CreateAuctionStoreState> => {
    const { tokenForm, configureAuction } = state
    const { committed, postAuctionLiquidityAllocation } = configureAuction
    if (tokenForm.mode !== TokenMode.CREATE_NEW || !committed) {
      return {}
    }

    const nextFormSupply = CurrencyAmount.fromRawAmount(tokenForm.totalSupply.currency, totalSupply.quotient)
    const nextTotalSupply = CurrencyAmount.fromRawAmount(committed.totalSupply.currency, totalSupply.quotient)
    // Preserve the user's deposit fraction of supply across the supply change.
    const auctionSupplyPercent = new Percent(committed.auctionSupplyAmount.quotient, committed.totalSupply.quotient)
    const committedBase = buildAuctionAmountsFromLiquidityPreview(nextTotalSupply, {
      previewPercent: getPostAuctionLiquidityPreviewPercent(postAuctionLiquidityAllocation),
      auctionSupplyPercent,
    })

    return {
      tokenForm: { ...tokenForm, totalSupply: nextFormSupply },
      configureAuction: {
        ...configureAuction,
        committed: updateCommittedPostAuctionLiquidity(committedBase, postAuctionLiquidityAllocation),
      },
    }
  }
}
