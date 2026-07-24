import type { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import type { PriceSource } from '@universe/prices'
import { getPrimaryStablecoin, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import type { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getRouteMidPrice } from 'uniswap/src/features/transactions/swap/utils/usdAnchoring/getRouteMidPrice'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

/**
 * How the swap form's USD values were produced:
 *   route_mid            — one side anchored to an external price, the other derived
 *                          through the classic quote's route mid price
 *   execution_price      — one side anchored, the other derived through the trade's
 *                          execution price (no classic route pools available)
 *   independent_oracles  — legacy behavior: each side valued by its own price oracle
 */
export type UsdPricingMethod = 'route_mid' | 'execution_price' | 'independent_oracles'

/** Metadata describing how the displayed USD values were computed, for analytics tagging. */
export interface SwapUsdPricing {
  method: UsdPricingMethod
  anchorField?: CurrencyField
}

/** True when the displayed USD values were derived from the trade quote rather than independent oracles. */
export function isTradeDerivedUsdPricing(pricing: SwapUsdPricing | undefined): boolean {
  return pricing?.method === 'route_mid' || pricing?.method === 'execution_price'
}

// Confidence ranking of price-cache sources; higher wins the anchor.
// See `PriceSource` in @universe/prices: live WS pushes beat REST polls beat the TAPI quote fallback.
const SOURCE_CONFIDENCE: Record<PriceSource, number> = {
  aurora_ws: 3,
  aurora_rest_fallback: 2,
  tapi_quote: 1,
}

function getSourceConfidence(source: PriceSource | undefined): number {
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- cached source strings are unvalidated at runtime
  return source ? (SOURCE_CONFIDENCE[source] ?? 0) : 0
}

function isPrimaryStablecoin(currency: Currency): boolean {
  if (!isUniverseChainId(currency.chainId)) {
    return false
  }
  try {
    const stablecoin = getPrimaryStablecoin(currency.chainId)
    // oxlint-disable-next-line typescript/no-unnecessary-condition -- chains without stables yield undefined at runtime
    if (!stablecoin) {
      return false
    }
    return areCurrencyIdsEqual(currencyId(currency), currencyId(stablecoin))
  } catch {
    return false
  }
}

/**
 * Picks the side whose external USD price anchors the whole trade.
 *
 * Same-chain trades anchor the chain's primary stablecoin at its oracle value ($1)
 * when present — this matches the backend TAPI-quote fallback's own assumption.
 * Otherwise (including cross-chain trades, where "the chain's stablecoin" is
 * ambiguous) the side whose cached price has the more trustworthy source wins;
 * ties anchor the input side.
 */
export function selectUsdAnchorField({
  inputCurrency,
  outputCurrency,
  inputPriceSource,
  outputPriceSource,
}: {
  inputCurrency: Currency
  outputCurrency: Currency
  inputPriceSource: PriceSource | undefined
  outputPriceSource: PriceSource | undefined
}): CurrencyField {
  const isSameChain = inputCurrency.chainId === outputCurrency.chainId
  if (isSameChain) {
    if (isPrimaryStablecoin(inputCurrency)) {
      return CurrencyField.INPUT
    }
    if (isPrimaryStablecoin(outputCurrency)) {
      return CurrencyField.OUTPUT
    }
  }

  return getSourceConfidence(outputPriceSource) > getSourceConfidence(inputPriceSource)
    ? CurrencyField.OUTPUT
    : CurrencyField.INPUT
}

function quoteUsd(
  price: Price<Currency, Currency> | undefined,
  amount: Maybe<CurrencyAmount<Currency>>,
): CurrencyAmount<Currency> | null {
  if (!price || !amount) {
    return null
  }
  try {
    if (!amount.currency.equals(price.baseCurrency)) {
      return null
    }
    return price.quote(amount)
  } catch {
    return null
  }
}

/**
 * The price used to convert the anchor side's USD price into the other side's:
 * the classic route's mid price when available, else the trade's execution price.
 * Route MID (not execution price) keeps price impact and fees visible — an
 * exact-input trade naturally shows output USD slightly below input USD.
 */
function getConversionPrice(trade: Trade | IndicativeTrade): {
  price: Price<Currency, Currency>
  method: 'route_mid' | 'execution_price'
} {
  if (!trade.indicative && isClassic(trade)) {
    const midPrice = getRouteMidPrice({
      route: trade.quote.quote.route,
      inputCurrency: trade.inputAmount.currency,
      outputCurrency: trade.outputAmount.currency,
    })
    if (midPrice) {
      return { price: midPrice, method: 'route_mid' }
    }
  }
  return { price: trade.executionPrice, method: 'execution_price' }
}

interface AnchoredUsdValuesArgs {
  trade: Trade | IndicativeTrade | undefined | null
  inputAmount: Maybe<CurrencyAmount<Currency>>
  outputAmount: Maybe<CurrencyAmount<Currency>>
  /** External oracle USD price of the input currency (from `useUSDCPrice`). */
  inputUsdPrice: Price<Currency, Currency> | undefined
  /** External oracle USD price of the output currency (from `useUSDCPrice`). */
  outputUsdPrice: Price<Currency, Currency> | undefined
  inputPriceSource: PriceSource | undefined
  outputPriceSource: PriceSource | undefined
}

export interface AnchoredUsdValues {
  input: CurrencyAmount<Currency> | null
  output: CurrencyAmount<Currency> | null
  pricing: SwapUsdPricing
}

/**
 * Values both sides of a trade in USD from a single external price (the anchor),
 * deriving the other side through the same quote so the two USD values can never
 * contradict the quoted conversion rate (INFRA-2364).
 *
 * Fallback ladder: classic route mid price → trade execution price → legacy
 * independent-oracle valuation (also used when there is no trade — e.g. wraps
 * without a quote — or when the anchor has no external price).
 *
 * Never throws: pricing math over quote data must not be able to crash the swap
 * form, so any unexpected error in the anchored derivation is caught, logged,
 * and degrades to the legacy independent-oracle values.
 */
export function computeAnchoredUsdValues(args: AnchoredUsdValuesArgs): AnchoredUsdValues {
  const independent: AnchoredUsdValues = {
    input: quoteUsd(args.inputUsdPrice, args.inputAmount),
    output: quoteUsd(args.outputUsdPrice, args.outputAmount),
    pricing: { method: 'independent_oracles' },
  }

  if (!args.trade) {
    return independent
  }

  try {
    return deriveTradeAnchoredUsdValues(args, independent)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'anchoredUsdPricing', function: 'computeAnchoredUsdValues' },
    })
    return independent
  }
}

function deriveTradeAnchoredUsdValues(
  {
    trade,
    inputAmount,
    outputAmount,
    inputUsdPrice,
    outputUsdPrice,
    inputPriceSource,
    outputPriceSource,
  }: AnchoredUsdValuesArgs,
  independent: AnchoredUsdValues,
): AnchoredUsdValues {
  if (!trade) {
    return independent
  }

  const inputCurrency = trade.inputAmount.currency
  const outputCurrency = trade.outputAmount.currency

  const anchorField = selectUsdAnchorField({ inputCurrency, outputCurrency, inputPriceSource, outputPriceSource })
  const anchorUsdPrice = anchorField === CurrencyField.INPUT ? inputUsdPrice : outputUsdPrice
  const anchorCurrency = anchorField === CurrencyField.INPUT ? inputCurrency : outputCurrency
  if (!anchorUsdPrice || !anchorUsdPrice.baseCurrency.equals(anchorCurrency)) {
    return independent
  }

  const { price: conversionPrice, method } = getConversionPrice(trade)

  let derivedUsdPrice: Price<Currency, Currency>
  try {
    // conversionPrice is Price<input, output>; composing with the anchor's USD price
    // yields the other side's USD price through the same quote.
    derivedUsdPrice =
      anchorField === CurrencyField.INPUT
        ? conversionPrice.invert().multiply(anchorUsdPrice)
        : conversionPrice.multiply(anchorUsdPrice)
  } catch {
    return independent
  }

  const inputPrice = anchorField === CurrencyField.INPUT ? anchorUsdPrice : derivedUsdPrice
  const outputPrice = anchorField === CurrencyField.INPUT ? derivedUsdPrice : anchorUsdPrice

  const input = quoteUsd(inputPrice, inputAmount)
  const output = quoteUsd(outputPrice, outputAmount)

  // A present side that fails anchored valuation (e.g. transient currency mismatch while
  // a new quote is in flight) degrades the whole pair to legacy behavior rather than
  // mixing anchored and independent values.
  if ((inputAmount && !input) || (outputAmount && !output)) {
    return independent
  }

  return { input, output, pricing: { method, anchorField } }
}
