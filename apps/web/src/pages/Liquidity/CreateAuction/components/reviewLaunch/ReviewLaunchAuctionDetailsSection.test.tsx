import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import i18n from 'uniswap/src/i18n'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { vi } from 'vitest'
import { ReviewLaunchAuctionDetailsSection } from '~/pages/Liquidity/CreateAuction/components/reviewLaunch/ReviewLaunchAuctionDetailsSection'
import { DEFAULT_CREATE_AUCTION_STATE, type AuctionTokenAmounts } from '~/pages/Liquidity/CreateAuction/types'
import { render, screen } from '~/test-utils/render'

const token = new Token(UniverseChainId.Mainnet, `0x${'1'.padStart(40, '0')}`, 18, 'TKN')
const amount = (raw: bigint): CurrencyAmount<Token> => CurrencyAmount.fromRawAmount(token, raw.toString())
const committed: AuctionTokenAmounts = {
  totalSupply: amount(10n ** 27n),
  auctionSupplyAmount: amount(10n ** 26n),
  postAuctionLiquidityAmount: amount(10n ** 25n),
}
const raiseCurrencyInfo = { currency: token } as CurrencyInfo

const PRE_BID_LABEL = i18n.t('toucan.createAuction.step.configureAuction.preBid.startDate')

function renderSection({ isQuickLaunch }: { isQuickLaunch: boolean }): ReturnType<typeof render> {
  const startTime = new Date(Date.now() + ONE_DAY_MS)
  return render(
    <ReviewLaunchAuctionDetailsSection
      configureAuction={{
        ...DEFAULT_CREATE_AUCTION_STATE.configureAuction,
        committed,
        startTime,
        endTime: new Date(startTime.getTime() + 4 * ONE_DAY_MS),
        preBidStartTime: new Date(startTime.getTime() - 15 * 60_000),
      }}
      committed={committed}
      raiseCurrencyInfo={raiseCurrencyInfo}
      chainId={UniverseChainId.Mainnet}
      tokenSymbol="TKN"
      isNewToken
      isQuickLaunch={isQuickLaunch}
      tokenColor={undefined}
      stableRaiseUsdPrice={null}
      floorPriceNum={undefined}
      fdv={undefined}
      onOpenKycHookExplorer={vi.fn()}
    />,
  )
}

describe('ReviewLaunchAuctionDetailsSection pre-bid row', () => {
  it('shows when the manual wizard configured a window', () => {
    renderSection({ isQuickLaunch: false })

    expect(screen.getByText(PRE_BID_LABEL)).toBeInTheDocument()
  })

  // This is the last screen before signing an immutable auction, and the request builder drops the
  // pre-bid field in quick-launch mode. Rendering the row anyway would promise the creator that
  // bidding opens at T while the transaction omits the window entirely.
  it('stays hidden in quick-launch mode, which omits the window from the request', () => {
    renderSection({ isQuickLaunch: true })

    expect(screen.queryByText(PRE_BID_LABEL)).toBeNull()
  })
})
