import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { RenderHookResult } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import type { Currency } from '@uniswap/sdk-core'
import { CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import type { ClassicQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import type { PriceSource, TokenPriceData } from '@universe/prices'
import { normalizeToken, priceKeys } from '@universe/prices'
import React, { type PropsWithChildren } from 'react'
import { USDC, USDG_ROBINHOOD, nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSwapAnchoredUsdValues } from 'uniswap/src/features/transactions/swap/hooks/useSwapAnchoredUsdValues'
import { createClassicTrade } from 'uniswap/src/features/transactions/swap/types/classic'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import type { AnchoredUsdValues } from 'uniswap/src/features/transactions/swap/utils/usdAnchoring/anchoredUsdPricing'
import { isTradeDerivedUsdPricing } from 'uniswap/src/features/transactions/swap/utils/usdAnchoring/anchoredUsdPricing'
import { ETH, WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'

const { usdPrices, usdPriceKey } = vi.hoisted(() => {
  /** Keys the mocked `useUSDCPrice` responses by chain + native/erc20 address. */
  const usdPriceKey = (currency: Currency): string =>
    `${currency.chainId}-${currency.isNative ? 'native' : currency.address.toLowerCase()}`
  return { usdPrices: new Map<string, Price<Currency, Currency>>(), usdPriceKey }
})

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCPrice: (currency?: Currency): { price: Price<Currency, Currency> | undefined; isLoading: boolean } => ({
    price: currency ? usdPrices.get(usdPriceKey(currency)) : undefined,
    isLoading: false,
  }),
}))

// ── Fixtures (same INFRA-2364 scenario as anchoredUsdPricing.test.ts) ────────
// 20000 USDG in → 11.5067 ETH out on Robinhood; route mid 1736.5 USDG per ETH,
// biased TAPI-fallback ETH spot $1,769.78.
const ETH_ROBINHOOD = nativeOnChain(UniverseChainId.Robinhood)
const WETH_ROBINHOOD_ADDRESS = '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73'
const SWAPPER = '0xAAAA44272dc658575Ba38f43C438447dDED45358'
const USDG_AMOUNT_RAW = '20000000000' // 20,000 USDG (6 decimals)
const ETH_AMOUNT_RAW = '11506700000000000000' // 11.5067 ETH
const SQRT_RATIO_1736_5_USDG_PER_ETH = '3301543148816772793807165'
const EXPECTED_DERIVED_OUTPUT_USD = 19981.38 // 11.5067 × 1736.5
const LEGACY_OUTPUT_USD = 20364.33 // 11.5067 × 1769.78

const usdgAmount = CurrencyAmount.fromRawAmount(USDG_ROBINHOOD, USDG_AMOUNT_RAW)
const ethAmount = CurrencyAmount.fromRawAmount(ETH_ROBINHOOD, ETH_AMOUNT_RAW)
const usdgUsdPrice = new Price(USDG_ROBINHOOD, USDG_ROBINHOOD, '1', '1')
const ethSpotUsdPrice = new Price(ETH_ROBINHOOD, USDG_ROBINHOOD, '1000000000000000000', '1769780000')

const usdgToEthRoute: TradingApi.ClassicQuote['route'] = [
  [
    {
      type: 'v3-pool',
      address: `0x${'a'.repeat(40)}`,
      tokenIn: { address: USDG_ROBINHOOD.address, symbol: 'USDG', decimals: '6' },
      tokenOut: { address: WETH_ROBINHOOD_ADDRESS, symbol: 'WETH', decimals: '18' },
      sqrtRatioX96: SQRT_RATIO_1736_5_USDG_PER_ETH,
      liquidity: '1000000000',
      tickCurrent: '0',
      fee: '500',
      amountIn: USDG_AMOUNT_RAW,
    },
  ],
]

function createRobinhoodClassicTrade(): Trade {
  const quote = {
    requestId: 'test-request-id',
    routing: TradingApi.Routing.CLASSIC,
    permitData: null,
    quote: {
      chainId: UniverseChainId.Robinhood,
      input: { amount: USDG_AMOUNT_RAW, token: USDG_ROBINHOOD.address },
      output: { amount: ETH_AMOUNT_RAW, token: '0x0000000000000000000000000000000000000000', recipient: SWAPPER },
      swapper: SWAPPER,
      tradeType: TradingApi.TradeType.EXACT_INPUT,
      quoteId: 'test-quote-id',
      slippage: 0.5,
      route: usdgToEthRoute,
    },
  } as unknown as ClassicQuoteResponse

  const trade = createClassicTrade({
    quote,
    currencyIn: USDG_ROBINHOOD,
    currencyOut: ETH_ROBINHOOD,
    tradeType: TradeType.EXACT_INPUT,
    deadline: 1735689600,
  })
  if (!trade) {
    throw new Error('failed to build classic trade fixture')
  }
  return trade
}

function usdOf(amount: CurrencyAmount<Currency> | null): number {
  if (!amount) {
    throw new Error('expected a USD amount')
  }
  return parseFloat(amount.toExact())
}

let queryClient: QueryClient

beforeEach(() => {
  usdPrices.clear()
  queryClient = new QueryClient()
})

/** Writes a cached token price with the given source, exactly as the price feeds do. */
function seedCachedPriceSource(currency: Currency, source: PriceSource): void {
  const { chainId, address } = normalizeToken(currency)
  const data: TokenPriceData = { price: 1, timestamp: Date.now(), source }
  queryClient.setQueryData(priceKeys.token(chainId, address), data)
}

function renderUseSwapAnchoredUsdValues(
  args: Parameters<typeof useSwapAnchoredUsdValues>[0],
): RenderHookResult<AnchoredUsdValues, undefined> {
  const client = queryClient
  const wrapper = function Wrapper({ children }: PropsWithChildren): React.ReactElement {
    return React.createElement(QueryClientProvider, { client }, children)
  }
  return renderHook(() => useSwapAnchoredUsdValues(args), { wrapper })
}

describe(useSwapAnchoredUsdValues, () => {
  it('returns anchored USD values derived through the trade when a trade and prices are present', () => {
    usdPrices.set(usdPriceKey(USDG_ROBINHOOD), usdgUsdPrice)
    usdPrices.set(usdPriceKey(ETH_ROBINHOOD), ethSpotUsdPrice)

    const { result } = renderUseSwapAnchoredUsdValues({
      trade: createRobinhoodClassicTrade(),
      inputAmount: usdgAmount,
      outputAmount: ethAmount,
    })

    expect(result.current.pricing).toEqual({ method: 'route_mid', anchorField: CurrencyField.INPUT })
    expect(isTradeDerivedUsdPricing(result.current.pricing)).toBe(true)
    expect(usdOf(result.current.input)).toBe(20000)
    // Output derived through the quote, not the biased $1,769.78 spot oracle.
    expect(usdOf(result.current.output)).toBeLessThan(20000)
    expect(usdOf(result.current.output)).toBeCloseTo(EXPECTED_DERIVED_OUTPUT_USD, 1)
  })

  it('falls back to independent oracle values when there is no trade', () => {
    usdPrices.set(usdPriceKey(USDG_ROBINHOOD), usdgUsdPrice)
    usdPrices.set(usdPriceKey(ETH_ROBINHOOD), ethSpotUsdPrice)

    const { result } = renderUseSwapAnchoredUsdValues({
      trade: undefined,
      inputAmount: usdgAmount,
      outputAmount: ethAmount,
    })

    expect(result.current.pricing).toEqual({ method: 'independent_oracles' })
    expect(isTradeDerivedUsdPricing(result.current.pricing)).toBe(false)
    expect(usdOf(result.current.input)).toBe(20000)
    expect(usdOf(result.current.output)).toBeCloseTo(LEGACY_OUTPUT_USD, 1)
  })

  it('falls back to independent oracle values when the anchor side has no external price', () => {
    // Stablecoin anchor selected, but no USD price available for it.
    usdPrices.set(usdPriceKey(ETH_ROBINHOOD), ethSpotUsdPrice)

    const { result } = renderUseSwapAnchoredUsdValues({
      trade: createRobinhoodClassicTrade(),
      inputAmount: usdgAmount,
      outputAmount: ethAmount,
    })

    expect(result.current.pricing).toEqual({ method: 'independent_oracles' })
    expect(result.current.input).toBeNull()
    expect(usdOf(result.current.output)).toBeCloseTo(LEGACY_OUTPUT_USD, 1)
  })

  describe('usdPricing metadata reflects the cached price sources used to pick the anchor', () => {
    // Mainnet WETH → ETH (neither side a primary stablecoin), 1:1 execution price,
    // with deliberately skewed per-side oracles so the anchor choice is observable.
    const oneEthRaw = '1000000000000000000'
    const wethAmount = CurrencyAmount.fromRawAmount(WETH, oneEthRaw)
    const ethOutAmount = CurrencyAmount.fromRawAmount(ETH, oneEthRaw)
    const wethUsdPrice = new Price(WETH, USDC, oneEthRaw, '1995000000') // $1995
    const ethUsdPrice = new Price(ETH, USDC, oneEthRaw, '2000000000') // $2000
    const unwrapTrade = {
      indicative: false,
      routing: TradingApi.Routing.DUTCH_V2,
      inputAmount: wethAmount,
      outputAmount: ethOutAmount,
      executionPrice: new Price(WETH, ETH, oneEthRaw, oneEthRaw),
    } as unknown as Trade

    beforeEach(() => {
      usdPrices.set(usdPriceKey(WETH), wethUsdPrice)
      usdPrices.set(usdPriceKey(ETH), ethUsdPrice)
    })

    it('anchors the input side when no cached price sources exist (confidence tie)', () => {
      const { result } = renderUseSwapAnchoredUsdValues({
        trade: unwrapTrade,
        inputAmount: wethAmount,
        outputAmount: ethOutAmount,
      })

      expect(result.current.pricing).toEqual({ method: 'execution_price', anchorField: CurrencyField.INPUT })
      expect(usdOf(result.current.input)).toBe(1995)
      expect(usdOf(result.current.output)).toBe(1995)
    })

    it('anchors the side whose cached price source is more trustworthy', () => {
      seedCachedPriceSource(WETH, 'tapi_quote')
      seedCachedPriceSource(ETH, 'aurora_ws')

      const { result } = renderUseSwapAnchoredUsdValues({
        trade: unwrapTrade,
        inputAmount: wethAmount,
        outputAmount: ethOutAmount,
      })

      expect(result.current.pricing).toEqual({ method: 'execution_price', anchorField: CurrencyField.OUTPUT })
      expect(usdOf(result.current.input)).toBe(2000)
      expect(usdOf(result.current.output)).toBe(2000)
    })
  })

  describe('crash hardening: a malformed trade must never throw out of render', () => {
    beforeEach(() => {
      vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    })

    it('renders independent-oracle values when the trade quote data throws mid-derivation', () => {
      usdPrices.set(usdPriceKey(USDG_ROBINHOOD), usdgUsdPrice)
      usdPrices.set(usdPriceKey(ETH_ROBINHOOD), ethSpotUsdPrice)

      const brokenTrade = {
        indicative: false,
        routing: TradingApi.Routing.CLASSIC,
        inputAmount: usdgAmount,
        outputAmount: ethAmount,
        get quote(): never {
          throw new Error('corrupted quote')
        },
      } as unknown as Trade

      let result: RenderHookResult<AnchoredUsdValues, undefined>['result'] | undefined
      expect(() => {
        result = renderUseSwapAnchoredUsdValues({
          trade: brokenTrade,
          inputAmount: usdgAmount,
          outputAmount: ethAmount,
        }).result
      }).not.toThrow()

      expect(result?.current.pricing).toEqual({ method: 'independent_oracles' })
      expect(usdOf(result?.current.input ?? null)).toBe(20000)
      expect(usdOf(result?.current.output ?? null)).toBeCloseTo(LEGACY_OUTPUT_USD, 1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
    })

    it('renders without throwing when the classic route contains garbage pool data', () => {
      usdPrices.set(usdPriceKey(USDG_ROBINHOOD), usdgUsdPrice)
      usdPrices.set(usdPriceKey(ETH_ROBINHOOD), ethSpotUsdPrice)

      const garbageRoute = [
        [{ type: 'v3-pool', tokenIn: { address: 12345 }, tokenOut: { address: 67890 }, sqrtRatioX96: 'NaN' }],
      ] as unknown as TradingApi.ClassicQuote['route']
      const quote = {
        requestId: 'test-request-id',
        routing: TradingApi.Routing.CLASSIC,
        permitData: null,
        quote: {
          chainId: UniverseChainId.Robinhood,
          input: { amount: USDG_AMOUNT_RAW, token: USDG_ROBINHOOD.address },
          output: { amount: ETH_AMOUNT_RAW, token: '0x0000000000000000000000000000000000000000', recipient: SWAPPER },
          swapper: SWAPPER,
          tradeType: TradingApi.TradeType.EXACT_INPUT,
          quoteId: 'test-quote-id',
          slippage: 0.5,
          route: garbageRoute,
        },
      } as unknown as ClassicQuoteResponse
      const trade = createClassicTrade({
        quote,
        currencyIn: USDG_ROBINHOOD,
        currencyOut: ETH_ROBINHOOD,
        tradeType: TradeType.EXACT_INPUT,
        deadline: 1735689600,
      })
      if (!trade) {
        throw new Error('failed to build classic trade fixture')
      }

      let result: RenderHookResult<AnchoredUsdValues, undefined>['result'] | undefined
      expect(() => {
        result = renderUseSwapAnchoredUsdValues({
          trade,
          inputAmount: usdgAmount,
          outputAmount: ethAmount,
        }).result
      }).not.toThrow()

      // Route mid is unusable → the ladder degrades to the execution price.
      expect(result?.current.pricing).toEqual({ method: 'execution_price', anchorField: CurrencyField.INPUT })
      expect(usdOf(result?.current.input ?? null)).toBe(20000)
    })
  })
})
