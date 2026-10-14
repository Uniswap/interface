import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { PostAuctionLiquiditySection } from '~/pages/Liquidity/CreateAuction/components/PostAuctionLiquiditySection'
import { PostAuctionLiquidityAllocationType, RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { getRaiseCurrencyAsCurrency } from '~/pages/Liquidity/CreateAuction/utils'
import { render, screen } from '~/test-utils/render'

const AUCTION_TOKEN = new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000001', 18, 'KAL')
const ZERO = CurrencyAmount.fromRawAmount(AUCTION_TOKEN, 0)

function renderSection(raiseCurrency: RaiseCurrency) {
  return render(
    <PostAuctionLiquiditySection
      allocation={{ type: PostAuctionLiquidityAllocationType.SINGLE, percent: 100 }}
      postAuctionLiquidityPercent={100}
      auctionSupplyAmount={ZERO}
      postAuctionLiquidityAmount={ZERO}
      floorPrice=""
      raiseCurrency={raiseCurrency}
      chainId={UniverseChainId.Mainnet}
      tokenSymbol="KAL"
      inputCurrency="raise"
      usdPriceNum={null}
      onAllocationTypeSelect={() => {}}
      onSelectPercent={() => {}}
      onAddTier={() => {}}
      onUpdateTier={() => {}}
      onRemoveTier={() => {}}
    />,
  )
}

describe('PostAuctionLiquiditySection', () => {
  it.each([RaiseCurrency.STABLECOIN, RaiseCurrency.NATIVE])(
    'interpolates the %s raise currency symbol, never the enum value',
    (raiseCurrency) => {
      const symbol = getRaiseCurrencyAsCurrency(raiseCurrency, UniverseChainId.Mainnet)?.symbol
      expect(symbol).toBeTruthy()

      const { container } = renderSection(raiseCurrency)
      const text = container.textContent

      expect(text).not.toContain(raiseCurrency)
      expect(screen.getByText(`0 ${symbol} at floor price*`)).toBeInTheDocument()
      expect(text).toContain(`percentage of ${symbol} proceeds`)
    },
  )
})
