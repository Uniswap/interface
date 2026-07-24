import type { Currency } from '@uniswap/sdk-core'
import { CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import type { ClassicQuoteResponse, WrapQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { USDC, USDC_UNICHAIN, USDG_ROBINHOOD, nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createClassicTrade } from 'uniswap/src/features/transactions/swap/types/classic'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { createWrapTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { calculateRateLine } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  computeAnchoredUsdValues,
  isTradeDerivedUsdPricing,
  selectUsdAnchorField,
} from 'uniswap/src/features/transactions/swap/utils/usdAnchoring/anchoredUsdPricing'
import { ETH, WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { mockLocalizationContext } from 'uniswap/src/test/mocks/locale'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'

const ETH_ROBINHOOD = nativeOnChain(UniverseChainId.Robinhood)
const WETH_ROBINHOOD_ADDRESS = '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73'
const SWAPPER = '0xAAAA44272dc658575Ba38f43C438447dDED45358'

// ── INFRA-2364 regression fixture ────────────────────────────────────────────
// 20000 USDG in → 11.5067 ETH out on Robinhood.
// Execution price: 20000 / 11.5067 = 1738.12 USDG per ETH.
// Route mid (from the pool below): 1736.50 USDG per ETH (mid is slightly better
// than execution — the difference is price impact + fees).
// TAPI-fallback spot for ETH: $1,769.78 → legacy output USD $20,364.11 (> $20,000).
const USDG_AMOUNT_RAW = '20000000000' // 20,000 USDG (6 decimals)
const ETH_AMOUNT_RAW = '11506700000000000000' // 11.5067 ETH
// token0 = WETH (0x0Bd7… sorts below USDG 0x5fc5…), token1 = USDG.
// sqrt(1736.5e6/1e18) * 2^96, i.e. a 1736.5 USDG-per-ETH mid.
const SQRT_RATIO_1736_5_USDG_PER_ETH = '3301543148816772793807165'
const TAPI_FALLBACK_ETH_SPOT_USD = 1769.78
const EXPECTED_DERIVED_OUTPUT_USD = 19981.38 // 11.5067 × 1736.5
const LEGACY_OUTPUT_USD = 20364.33 // 11.5067 × 1769.78

const usdgAmount = CurrencyAmount.fromRawAmount(USDG_ROBINHOOD, USDG_AMOUNT_RAW)
const ethAmount = CurrencyAmount.fromRawAmount(ETH_ROBINHOOD, ETH_AMOUNT_RAW)

/** $1.00 per USDG — what `useUSDCPrice` returns for the chain's primary stablecoin. */
const usdgUsdPrice = new Price(USDG_ROBINHOOD, USDG_ROBINHOOD, '1', '1')
/** $1,769.78 per ETH — the biased TAPI-quote fallback spot. */
const ethSpotUsdPrice = new Price(ETH_ROBINHOOD, USDG_ROBINHOOD, '1000000000000000000', '1769780000')

function createRobinhoodClassicQuote({ route }: { route?: TradingApi.ClassicQuote['route'] }): ClassicQuoteResponse {
  return {
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
      route,
    },
  } as unknown as ClassicQuoteResponse
}

function createRobinhoodClassicTrade({ route }: { route?: TradingApi.ClassicQuote['route'] }): Trade {
  const trade = createClassicTrade({
    quote: createRobinhoodClassicQuote({ route }),
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

function usdOf(amount: CurrencyAmount<Currency> | null): number {
  if (!amount) {
    throw new Error('expected a USD amount')
  }
  return parseFloat(amount.toExact())
}

describe(selectUsdAnchorField, () => {
  it('anchors the input side when it is the chain primary stablecoin', () => {
    expect(
      selectUsdAnchorField({
        inputCurrency: USDG_ROBINHOOD,
        outputCurrency: ETH_ROBINHOOD,
        inputPriceSource: undefined,
        outputPriceSource: 'aurora_ws',
      }),
    ).toBe(CurrencyField.INPUT)
  })

  it('anchors the output side when it is the chain primary stablecoin', () => {
    expect(
      selectUsdAnchorField({
        inputCurrency: ETH_ROBINHOOD,
        outputCurrency: USDG_ROBINHOOD,
        inputPriceSource: 'aurora_ws',
        outputPriceSource: undefined,
      }),
    ).toBe(CurrencyField.OUTPUT)
  })

  it('anchors the side with the higher-confidence price source when neither is the primary stablecoin', () => {
    expect(
      selectUsdAnchorField({
        inputCurrency: WETH,
        outputCurrency: ETH,
        inputPriceSource: 'tapi_quote',
        outputPriceSource: 'aurora_ws',
      }),
    ).toBe(CurrencyField.OUTPUT)

    expect(
      selectUsdAnchorField({
        inputCurrency: WETH,
        outputCurrency: ETH,
        inputPriceSource: 'aurora_rest_fallback',
        outputPriceSource: 'tapi_quote',
      }),
    ).toBe(CurrencyField.INPUT)
  })

  it('anchors the input side on a source-confidence tie', () => {
    expect(
      selectUsdAnchorField({
        inputCurrency: WETH,
        outputCurrency: ETH,
        inputPriceSource: 'aurora_ws',
        outputPriceSource: 'aurora_ws',
      }),
    ).toBe(CurrencyField.INPUT)
  })

  it('ignores the stablecoin rule for cross-chain trades (two chains, two stablecoins)', () => {
    // Both sides are their chain's primary stablecoin; source confidence must decide.
    expect(
      selectUsdAnchorField({
        inputCurrency: USDC,
        outputCurrency: USDC_UNICHAIN,
        inputPriceSource: 'tapi_quote',
        outputPriceSource: 'aurora_ws',
      }),
    ).toBe(CurrencyField.OUTPUT)
  })
})

describe(computeAnchoredUsdValues, () => {
  describe('INFRA-2364 regression: 20000 USDG → 11.5067 ETH on a TAPI-fallback chain', () => {
    const trade = createRobinhoodClassicTrade({ route: usdgToEthRoute })
    const result = computeAnchoredUsdValues({
      trade,
      inputAmount: usdgAmount,
      outputAmount: ethAmount,
      inputUsdPrice: usdgUsdPrice,
      outputUsdPrice: ethSpotUsdPrice,
      inputPriceSource: undefined,
      outputPriceSource: 'tapi_quote',
    })

    it('anchors the stablecoin side at $1 and derives the other via the route mid price', () => {
      expect(result.pricing).toEqual({ method: 'route_mid', anchorField: CurrencyField.INPUT })
      expect(usdOf(result.input)).toBe(20000)
    })

    it('never shows more USD out than in on an exact-input swap', () => {
      const outputUsd = usdOf(result.output)
      expect(outputUsd).toBeLessThan(20000)
      expect(outputUsd).toBeCloseTo(EXPECTED_DERIVED_OUTPUT_USD, 1)
      // The legacy independent-oracle behavior showed $20,364.11 — must be gone.
      expect(Math.abs(outputUsd - LEGACY_OUTPUT_USD)).toBeGreaterThan(300)
    })

    it('keeps the rate-line parenthetical consistent with the displayed rate and panel USD values', () => {
      const formatter = mockLocalizationContext({}).useLocalizationContext()

      // "1 ETH = 1738.12 USDG ($…)" orientation: the parenthetical is USD per 1 ETH.
      const perEthUsd = calculateRateLine({
        usdAmountOut: result.output,
        outputCurrencyAmount: trade.outputAmount,
        trade,
        showInverseRate: true,
        formatter,
      })
      const perEthUsdValue = parseFloat(perEthUsd.replace(/[^0-9.]/g, ''))
      // ≈ $1,736.50 (route mid ≈ execution rate of 1738.12), NOT the $1,769.78 spot.
      expect(perEthUsdValue).toBeCloseTo(1736.5, 0)
      expect(Math.abs(perEthUsdValue - TAPI_FALLBACK_ETH_SPOT_USD)).toBeGreaterThan(30)
      // Consistent with the output panel: same per-token USD price.
      expect(perEthUsdValue).toBeCloseTo(usdOf(result.output) / 11.5067, 0)

      // Inverse orientation: USD per 1 USDG ≈ $1.
      const perUsdgUsd = calculateRateLine({
        usdAmountOut: result.output,
        outputCurrencyAmount: trade.outputAmount,
        trade,
        showInverseRate: false,
        formatter,
      })
      expect(parseFloat(perUsdgUsd.replace(/[^0-9.]/g, ''))).toBeCloseTo(1, 1)
    })

    it('shows the same per-unit parenthetical for form-state and trade amounts', () => {
      // The parenthetical is `usdValue / amount` where `usdValue` is the anchored price
      // quoted over the SAME amount object, so the amount cancels and the displayed
      // number is the per-unit anchored price regardless of whether the pair is built
      // from the form-state currencyAmount or from the trade amount (the only residual
      // difference is `toSignificant()`'s 6-significant-digit display rounding, ~1e-5
      // relative — sub-cent here).
      const formatter = mockLocalizationContext({}).useLocalizationContext()

      // A form-state output amount that differs from the router's quoted 11.5067 ETH
      // (e.g. a raw user-entered exact-output value).
      const formStateEthAmount = CurrencyAmount.fromRawAmount(ETH_ROBINHOOD, '5000000000000000000') // 5 ETH
      const trade = createRobinhoodClassicTrade({ route: usdgToEthRoute })
      const anchoredForFormAmount = computeAnchoredUsdValues({
        trade,
        inputAmount: usdgAmount,
        outputAmount: formStateEthAmount,
        inputUsdPrice: usdgUsdPrice,
        outputUsdPrice: ethSpotUsdPrice,
        inputPriceSource: undefined,
        outputPriceSource: 'tapi_quote',
      })
      expect(anchoredForFormAmount.pricing).toEqual({ method: 'route_mid', anchorField: CurrencyField.INPUT })

      const parsedRateLine = ({
        usdAmountOut,
        outputCurrencyAmount,
        showInverseRate,
      }: {
        usdAmountOut: CurrencyAmount<Currency> | null
        outputCurrencyAmount: CurrencyAmount<Currency>
        showInverseRate: boolean
      }): number =>
        parseFloat(
          calculateRateLine({ usdAmountOut, outputCurrencyAmount, trade, showInverseRate, formatter }).replace(
            /[^0-9.]/g,
            '',
          ),
        )

      for (const showInverseRate of [true, false]) {
        const fromTradeAmount = parsedRateLine({
          usdAmountOut: result.output, // anchored USD of trade.outputAmount (11.5067 ETH)
          outputCurrencyAmount: trade.outputAmount,
          showInverseRate,
        })
        const fromFormAmount = parsedRateLine({
          usdAmountOut: anchoredForFormAmount.output, // anchored USD of the form-state 5 ETH
          outputCurrencyAmount: formStateEthAmount,
          showInverseRate,
        })
        // Equal up to display rounding: the 2311-fold amount difference must not move the value.
        expect(Math.abs(fromTradeAmount - fromFormAmount) / fromTradeAmount).toBeLessThan(1e-4)
      }

      // And both equal the per-unit anchored (route mid) price, not any amount-dependent value.
      const exactPerEthUsd = usdOf(result.output) / 11.5067
      expect(
        parsedRateLine({
          usdAmountOut: anchoredForFormAmount.output,
          outputCurrencyAmount: formStateEthAmount,
          showInverseRate: true,
        }),
      ).toBeCloseTo(exactPerEthUsd, 1)
      expect(
        parsedRateLine({
          usdAmountOut: result.output,
          outputCurrencyAmount: trade.outputAmount,
          showInverseRate: true,
        }),
      ).toBeCloseTo(exactPerEthUsd, 1)
    })

    it('tags the values as trade-derived for analytics', () => {
      expect(isTradeDerivedUsdPricing(result.pricing)).toBe(true)
    })
  })

  describe('fallback ladder', () => {
    it('falls back to the execution price when the classic quote has no route pools', () => {
      const trade = createRobinhoodClassicTrade({ route: undefined })
      const result = computeAnchoredUsdValues({
        trade,
        inputAmount: usdgAmount,
        outputAmount: ethAmount,
        inputUsdPrice: usdgUsdPrice,
        outputUsdPrice: ethSpotUsdPrice,
        inputPriceSource: undefined,
        outputPriceSource: 'tapi_quote',
      })

      expect(result.pricing).toEqual({ method: 'execution_price', anchorField: CurrencyField.INPUT })
      // Execution-price derivation makes the sides proportional: exact-in shows equal USD.
      expect(usdOf(result.input)).toBe(20000)
      expect(usdOf(result.output)).toBeCloseTo(20000, 2)
    })

    it('falls back to the execution price for UniswapX trades', () => {
      const executionPrice = new Price(USDG_ROBINHOOD, ETH_ROBINHOOD, USDG_AMOUNT_RAW, ETH_AMOUNT_RAW)
      const dutchTrade = {
        indicative: false,
        routing: TradingApi.Routing.DUTCH_V2,
        inputAmount: usdgAmount,
        outputAmount: ethAmount,
        executionPrice,
      } as unknown as Trade

      const result = computeAnchoredUsdValues({
        trade: dutchTrade,
        inputAmount: usdgAmount,
        outputAmount: ethAmount,
        inputUsdPrice: usdgUsdPrice,
        outputUsdPrice: ethSpotUsdPrice,
        inputPriceSource: undefined,
        outputPriceSource: 'tapi_quote',
      })

      expect(result.pricing).toEqual({ method: 'execution_price', anchorField: CurrencyField.INPUT })
      expect(usdOf(result.output)).toBeCloseTo(20000, 2)
    })

    it('uses independent oracles when there is no trade', () => {
      const result = computeAnchoredUsdValues({
        trade: undefined,
        inputAmount: usdgAmount,
        outputAmount: ethAmount,
        inputUsdPrice: usdgUsdPrice,
        outputUsdPrice: ethSpotUsdPrice,
        inputPriceSource: undefined,
        outputPriceSource: 'tapi_quote',
      })

      expect(result.pricing).toEqual({ method: 'independent_oracles' })
      expect(usdOf(result.input)).toBe(20000)
      expect(usdOf(result.output)).toBeCloseTo(LEGACY_OUTPUT_USD, 1)
    })

    it('uses independent oracles when the anchor side has no external price', () => {
      const trade = createRobinhoodClassicTrade({ route: usdgToEthRoute })
      const result = computeAnchoredUsdValues({
        trade,
        inputAmount: usdgAmount,
        outputAmount: ethAmount,
        inputUsdPrice: undefined, // stablecoin anchor selected, but no price available
        outputUsdPrice: ethSpotUsdPrice,
        inputPriceSource: undefined,
        outputPriceSource: 'tapi_quote',
      })

      expect(result.pricing).toEqual({ method: 'independent_oracles' })
      expect(result.input).toBeNull()
      expect(usdOf(result.output)).toBeCloseTo(LEGACY_OUTPUT_USD, 1)
    })
  })

  describe('wrap', () => {
    it('values both sides identically through the 1:1 execution price', () => {
      const oneEthRaw = '1000000000000000000'
      const wrapTrade = createWrapTrade({
        quote: {
          requestId: 'test-request-id',
          routing: TradingApi.Routing.WRAP,
          permitData: null,
          quote: {
            chainId: 1,
            input: { amount: oneEthRaw, token: ETH.address },
            output: { amount: oneEthRaw, token: WETH.address, recipient: SWAPPER },
            swapper: SWAPPER,
            tradeType: TradingApi.TradeType.EXACT_INPUT,
            gasFee: '1',
          },
        } as unknown as WrapQuoteResponse,
        currencyIn: ETH,
        currencyOut: WETH,
        tradeType: TradeType.EXACT_INPUT,
      })
      if (!wrapTrade) {
        throw new Error('failed to build wrap trade fixture')
      }

      const inputAmount = CurrencyAmount.fromRawAmount(ETH, oneEthRaw)
      const outputAmount = CurrencyAmount.fromRawAmount(WETH, oneEthRaw)
      const ethUsd = new Price(ETH, USDC, '1000000000000000000', '2000000000') // $2000
      const wethUsd = new Price(WETH, USDC, '1000000000000000000', '1995000000') // skewed oracle: $1995

      const result = computeAnchoredUsdValues({
        trade: wrapTrade,
        inputAmount,
        outputAmount,
        inputUsdPrice: ethUsd,
        outputUsdPrice: wethUsd,
        inputPriceSource: 'aurora_ws',
        outputPriceSource: 'aurora_ws',
      })

      expect(result.pricing).toEqual({ method: 'execution_price', anchorField: CurrencyField.INPUT })
      expect(usdOf(result.input)).toBe(2000)
      expect(usdOf(result.output)).toBe(2000)
    })
  })

  describe('cross-chain bridging', () => {
    it('anchors by source confidence (not the stablecoin rule) and derives the other side', () => {
      const oneUsdcRaw = '1000000'
      const inputAmount = CurrencyAmount.fromRawAmount(USDC, oneUsdcRaw)
      const outputAmount = CurrencyAmount.fromRawAmount(USDC_UNICHAIN, oneUsdcRaw)
      const bridgeTrade = {
        indicative: false,
        routing: TradingApi.Routing.BRIDGE,
        inputAmount,
        outputAmount,
        executionPrice: new Price(USDC, USDC_UNICHAIN, oneUsdcRaw, oneUsdcRaw),
      } as unknown as Trade

      const result = computeAnchoredUsdValues({
        trade: bridgeTrade,
        inputAmount,
        outputAmount,
        inputUsdPrice: new Price(USDC, USDC, '1', '1'),
        // Skewed output oracle proves the derived side ignores it.
        outputUsdPrice: new Price(USDC_UNICHAIN, USDC_UNICHAIN, '100', '98'),
        inputPriceSource: 'aurora_ws',
        outputPriceSource: 'tapi_quote',
      })

      expect(result.pricing).toEqual({ method: 'execution_price', anchorField: CurrencyField.INPUT })
      expect(usdOf(result.input)).toBe(1)
      expect(usdOf(result.output)).toBe(1)
    })
  })

  describe('crash hardening: malformed quote data must degrade down the ladder, never throw', () => {
    beforeEach(() => {
      vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    })

    const baseArgs = {
      inputAmount: usdgAmount,
      outputAmount: ethAmount,
      inputUsdPrice: usdgUsdPrice,
      outputUsdPrice: ethSpotUsdPrice,
      inputPriceSource: undefined,
      outputPriceSource: 'tapi_quote',
    } as const

    it('degrades to the execution price when the route contains garbage pool data', () => {
      const garbageRoute = [
        [
          {
            type: 'v3-pool',
            tokenIn: { address: 12345, decimals: 'garbage' },
            tokenOut: { address: WETH_ROBINHOOD_ADDRESS, decimals: '18' },
            sqrtRatioX96: '1.5e18',
          },
        ],
      ] as unknown as TradingApi.ClassicQuote['route']
      const trade = createRobinhoodClassicTrade({ route: garbageRoute })

      const compute = (): ReturnType<typeof computeAnchoredUsdValues> =>
        computeAnchoredUsdValues({ trade, ...baseArgs })

      expect(compute).not.toThrow()
      const result = compute()
      expect(result.pricing).toEqual({ method: 'execution_price', anchorField: CurrencyField.INPUT })
      expect(usdOf(result.input)).toBe(20000)
    })

    it('degrades to the execution price when the route is not even an array', () => {
      const trade = createRobinhoodClassicTrade({
        route: { bogus: true } as unknown as TradingApi.ClassicQuote['route'],
      })

      const compute = (): ReturnType<typeof computeAnchoredUsdValues> =>
        computeAnchoredUsdValues({ trade, ...baseArgs })

      expect(compute).not.toThrow()
      expect(compute().pricing).toEqual({ method: 'execution_price', anchorField: CurrencyField.INPUT })
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
    })

    it('falls back to legacy independent-oracle values when the mid-price path blows up mid-way', () => {
      // Route mid succeeds structurally but the execution-price rung explodes: the whole
      // anchored derivation must degrade to the bottom of the ladder without throwing.
      const trade = createRobinhoodClassicTrade({ route: usdgToEthRoute })
      const explodingTrade = new Proxy(trade, {
        get(target, prop, receiver): unknown {
          if (prop === 'quote') {
            throw new Error('quote data corrupted mid-way')
          }
          return Reflect.get(target, prop, receiver)
        },
      })

      const compute = (): ReturnType<typeof computeAnchoredUsdValues> =>
        computeAnchoredUsdValues({ trade: explodingTrade, ...baseArgs })

      expect(compute).not.toThrow()
      const result = compute()
      expect(result.pricing).toEqual({ method: 'independent_oracles' })
      expect(usdOf(result.input)).toBe(20000)
      expect(usdOf(result.output)).toBeCloseTo(LEGACY_OUTPUT_USD, 1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
    })

    it('falls back to independent oracles when the executionPrice getter throws', () => {
      const brokenTrade = {
        indicative: false,
        routing: TradingApi.Routing.DUTCH_V2,
        inputAmount: usdgAmount,
        outputAmount: ethAmount,
        get executionPrice(): never {
          throw new Error('boom')
        },
      } as unknown as Trade

      const compute = (): ReturnType<typeof computeAnchoredUsdValues> =>
        computeAnchoredUsdValues({ trade: brokenTrade, ...baseArgs })

      expect(compute).not.toThrow()
      const result = compute()
      expect(result.pricing).toEqual({ method: 'independent_oracles' })
      expect(usdOf(result.input)).toBe(20000)
      expect(usdOf(result.output)).toBeCloseTo(LEGACY_OUTPUT_USD, 1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
    })

    it('falls back to independent oracles for a structurally empty trade object', () => {
      const compute = (): ReturnType<typeof computeAnchoredUsdValues> =>
        computeAnchoredUsdValues({ trade: {} as unknown as Trade, ...baseArgs })

      expect(compute).not.toThrow()
      expect(compute().pricing).toEqual({ method: 'independent_oracles' })
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
    })

    it('degrades gracefully on a zero-amount execution price (zero denominator after inversion)', () => {
      const zeroOutAmount = CurrencyAmount.fromRawAmount(ETH_ROBINHOOD, '0')
      const zeroTrade = {
        indicative: false,
        routing: TradingApi.Routing.DUTCH_V2,
        inputAmount: usdgAmount,
        outputAmount: zeroOutAmount,
        // Exact-input quote with zero out: inverting this price yields a zero denominator.
        executionPrice: new Price(USDG_ROBINHOOD, ETH_ROBINHOOD, USDG_AMOUNT_RAW, '0'),
      } as unknown as Trade

      const compute = (): ReturnType<typeof computeAnchoredUsdValues> =>
        computeAnchoredUsdValues({ trade: zeroTrade, ...baseArgs, outputAmount: zeroOutAmount })

      expect(compute).not.toThrow()
      const result = compute()
      // Whichever rung it lands on, it must produce values without throwing.
      expect(result.pricing.method).toBeDefined()
      expect(usdOf(result.input)).toBe(20000)
    })
  })

  describe('partial amounts', () => {
    it('still anchors when only one side amount is present', () => {
      const trade = createRobinhoodClassicTrade({ route: usdgToEthRoute })
      const result = computeAnchoredUsdValues({
        trade,
        inputAmount: usdgAmount,
        outputAmount: undefined,
        inputUsdPrice: usdgUsdPrice,
        outputUsdPrice: undefined,
        inputPriceSource: undefined,
        outputPriceSource: undefined,
      })

      expect(result.pricing).toEqual({ method: 'route_mid', anchorField: CurrencyField.INPUT })
      expect(usdOf(result.input)).toBe(20000)
      expect(result.output).toBeNull()
    })
  })
})
