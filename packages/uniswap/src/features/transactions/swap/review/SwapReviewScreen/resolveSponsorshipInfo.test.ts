import { TradingApi } from '@universe/api'
import { USDC, WBTC } from 'uniswap/src/constants/tokens'
import { resolveSponsorshipInfo } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/resolveSponsorshipInfo'
import type { ClassicSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { createMockCurrencyAmount, createMockTradeWithStatus } from 'uniswap/src/test/fixtures/transactions/swap'

const campaign: TradingApi.CampaignDetails = {
  headline: 'Welcome to Uniswap',
  description: 'First 1000 sponsorships',
  eligibleChains: [1, 130],
  allowances: [{ unit: TradingApi.CampaignAllowance.unit.FREE_SWAPS, total: '1000', remaining: '1000' }],
}

function createContextWithSponsorship(sponsorshipInfo?: TradingApi.SponsorshipInfo): ClassicSwapTxAndGasInfo {
  const mockTrade = createMockTradeWithStatus(
    createMockCurrencyAmount(USDC, '1000000000000000000'),
    createMockCurrencyAmount(WBTC, '1000000000000000000'),
  )
  const trade = mockTrade.trade as ClassicTrade
  if (sponsorshipInfo) {
    ;(trade.quote as { sponsorshipInfo?: TradingApi.SponsorshipInfo }).sponsorshipInfo = sponsorshipInfo
  }
  return { routing: TradingApi.Routing.CLASSIC, trade } as ClassicSwapTxAndGasInfo
}

describe('resolveSponsorshipInfo', () => {
  it('returns the full sponsorship info (with campaign) from the quote', () => {
    const context = createContextWithSponsorship({ sponsored: true, sponsorMetadata: { name: 'Uniswap' }, campaign })
    expect(resolveSponsorshipInfo(context)).toEqual({ sponsored: true, sponsorMetadata: { name: 'Uniswap' }, campaign })
  })

  it('returns the sponsorship info without a campaign when the quote omits one', () => {
    const context = createContextWithSponsorship({ sponsored: true, sponsorMetadata: { name: 'Uniswap' } })
    expect(resolveSponsorshipInfo(context)).toEqual({ sponsored: true, sponsorMetadata: { name: 'Uniswap' } })
  })

  it('returns the sponsorship info when sponsored with empty sponsorMetadata but a campaign', () => {
    const context = createContextWithSponsorship({ sponsored: true, sponsorMetadata: {}, campaign })
    expect(resolveSponsorshipInfo(context)).toEqual({ sponsored: true, sponsorMetadata: {}, campaign })
  })

  it('returns undefined when the quote is not sponsorable', () => {
    expect(resolveSponsorshipInfo(createContextWithSponsorship())).toBeUndefined()
  })
})
