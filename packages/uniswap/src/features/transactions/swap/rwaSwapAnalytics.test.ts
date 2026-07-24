import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Token } from '@uniswap/sdk-core'
import { isEquityMarketOffHours } from 'uniswap/src/features/rwa/equityMarketHours'
import type { RWAWhitelist } from 'uniswap/src/features/rwa/types'
import { getRwaSwapAnalyticsProperties } from 'uniswap/src/features/transactions/swap/rwaSwapAnalytics'

vi.mock('uniswap/src/features/rwa/equityMarketHours', () => ({
  isEquityMarketOffHours: vi.fn(),
}))

const MAINNET = 1
const TSLA_ADDRESS = '0xf6b1117ec07684D3958caD8BEb1b302bfD21103f'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const TSLA = new Token(MAINNET, TSLA_ADDRESS, 18, 'TSLA.on', 'Tesla')
const USDC = new Token(MAINNET, USDC_ADDRESS, 6, 'USDC', 'USD Coin')

const STOCK_WHITELIST: RWAWhitelist = [
  {
    symbol: 'TSLA',
    name: 'Tesla',
    icon: 'icon.png',
    category: RwaCategory.STOCKS,
    tokens: [{ chainId: MAINNET, address: TSLA_ADDRESS, issuer: 'ondo', name: 'Ondo', symbol: 'TSLA.on', logoUrl: '' }],
  },
]

describe(getRwaSwapAnalyticsProperties, () => {
  const mockIsOffHours = vi.mocked(isEquityMarketOffHours)

  beforeEach(() => {
    mockIsOffHours.mockReturnValue(false)
  })

  it('flags the tokenized-stock side(s) when the whitelist matches', () => {
    expect(
      getRwaSwapAnalyticsProperties({ inputCurrency: USDC, outputCurrency: TSLA, rwaWhitelist: STOCK_WHITELIST }),
    ).toMatchObject({ token_in_stocks: false, token_out_stocks: true })
  })

  it('leaves stock flags undefined when no whitelist is provided', () => {
    const result = getRwaSwapAnalyticsProperties({ inputCurrency: USDC, outputCurrency: TSLA })
    expect(result.token_in_stocks).toBeUndefined()
    expect(result.token_out_stocks).toBeUndefined()
  })

  it('sets price_warning only when price impact exceeds the warning threshold (>500 bps)', () => {
    const props = { inputCurrency: USDC, outputCurrency: TSLA }
    expect(getRwaSwapAnalyticsProperties({ ...props, priceImpactBasisPoints: 501 }).price_warning).toBe(true)
    expect(getRwaSwapAnalyticsProperties({ ...props, priceImpactBasisPoints: '750' }).price_warning).toBe(true)
    expect(getRwaSwapAnalyticsProperties({ ...props, priceImpactBasisPoints: 500 }).price_warning).toBe(false)
    expect(getRwaSwapAnalyticsProperties({ ...props, priceImpactBasisPoints: undefined }).price_warning).toBe(false)
  })

  it('reflects the equity market off-hours state in market_closed', () => {
    const props = { inputCurrency: USDC, outputCurrency: TSLA }
    expect(getRwaSwapAnalyticsProperties(props).market_closed).toBe(false)
    mockIsOffHours.mockReturnValue(true)
    expect(getRwaSwapAnalyticsProperties(props).market_closed).toBe(true)
  })
})
