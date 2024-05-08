import { MixedRouteSDK } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import { BigNumber } from 'ethers'
import { logger } from 'utilities/src/logger/logger'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'wallet/src/constants/transactions'
import {
  ClassicQuote,
  Quote,
  QuoteResponse,
  ChainId as TradingApiChainId,
  TokenInRoute as TradingApiTokenInRoute,
  V2PoolInRoute as TradingApiV2PoolInRoute,
  V3PoolInRoute as TradingApiV3PoolInRoute,
} from 'wallet/src/data/tradingApi/__generated__/index'
import { LocalizationContextState } from 'wallet/src/features/language/LocalizationContext'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { getBaseTradeAnalyticsProperties } from 'wallet/src/features/transactions/swap/analytics'
import { QuoteData, SwapFee, Trade } from 'wallet/src/features/transactions/swap/trade/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { QuoteType } from 'wallet/src/features/transactions/utils'
import { areAddressesEqual } from 'wallet/src/utils/addresses'
import { currencyId } from 'wallet/src/utils/currencyId'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

const NATIVE_ADDRESS_FOR_TRADING_API = '0x0000000000000000000000000000000000000000'

interface TradingApiResponseToTradeArgs {
  tokenInIsNative: boolean
  tokenOutIsNative: boolean
  tradeType: TradeType
  deadline: number
  slippageTolerance: number | undefined
  data: QuoteResponse | undefined
}

export function transformTradingApiResponseToTrade(
  params: TradingApiResponseToTradeArgs
): Trade | null {
  const { tokenInIsNative, tokenOutIsNative, tradeType, deadline, slippageTolerance, data } = params

  const routes = computeRoutesTradingApi(tokenInIsNative, tokenOutIsNative, data)

  if (!routes) {
    return null
  }

  const swapFee: SwapFee | undefined =
    data?.quote.portionAmount !== undefined && data?.quote?.portionBips !== undefined
      ? {
          recipient: data.quote.portionRecipient,
          percent: new Percent(data.quote.portionBips, '10000'),
          amount: data?.quote.portionAmount,
        }
      : undefined

  return new Trade({
    quoteData: { quote: data, quoteType: QuoteType.TradingApi },
    deadline,
    slippageTolerance: slippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE,
    v2Routes: routes?.flatMap((r) => (r?.routev2 ? { ...r, routev2: r.routev2 } : [])) ?? [],
    v3Routes: routes?.flatMap((r) => (r?.routev3 ? { ...r, routev3: r.routev3 } : [])) ?? [],
    mixedRoutes:
      routes?.flatMap((r) => (r?.mixedRoute ? { ...r, mixedRoute: r.mixedRoute } : [])) ?? [],
    tradeType,
    swapFee,
  })
}

/**
 * Transforms a Routing API quote into an array of routes that can be used to
 * create a `Trade`.
 */
export function computeRoutesTradingApi(
  tokenInIsNative: boolean,
  tokenOutIsNative: boolean,
  quoteResponse?: QuoteResponse
):
  | {
      routev3: V3Route<Currency, Currency> | null
      routev2: V2Route<Currency, Currency> | null
      mixedRoute: MixedRouteSDK<Currency, Currency> | null
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
  | undefined {
  // TODO : remove quote type check for Uniswap X integration
  if (!quoteResponse || !quoteResponse.quote || !isClassicQuote(quoteResponse.quote)) {
    return
  }

  const { quote } = quoteResponse

  if (!quote.route || quote.route?.length === 0) {
    return
  }

  const tokenIn = quote.route[0]?.[0]?.tokenIn
  const tokenOut = quote.route[0]?.[quote.route[0]?.length - 1]?.tokenOut

  if (!tokenIn || !tokenOut) {
    throw new Error('Expected both tokenIn and tokenOut to be present')
  }
  if (
    !tokenIn.chainId ||
    tokenOut.chainId === undefined ||
    !tokenIn.address ||
    !tokenOut.address ||
    !tokenIn.decimals ||
    !tokenOut.decimals
  ) {
    throw new Error('Expected all token properties to be present')
  }

  const parsedCurrencyIn = tokenInIsNative
    ? NativeCurrency.onChain(tokenIn.chainId)
    : parseTokenApi(tokenIn)

  const parsedCurrencyOut = tokenOutIsNative
    ? NativeCurrency.onChain(tokenOut.chainId)
    : parseTokenApi(tokenOut)

  try {
    return quote.route.map((route) => {
      if (route.length === 0) {
        throw new Error('Expected route to have at least one pair or pool')
      }

      const inputAmount = getCurrencyAmount({
        value: route[0]?.amountIn,
        valueType: ValueType.Raw,
        currency: parsedCurrencyIn,
      })
      const outputAmount = getCurrencyAmount({
        value: route[route.length - 1]?.amountOut,
        valueType: ValueType.Raw,
        currency: parsedCurrencyOut,
      })

      if (!inputAmount || !outputAmount) {
        throw new Error('Expected both amountIn and amountOut to be present')
      }

      const isOnlyV2 = isV2OnlyRouteApi(route)
      const isOnlyV3 = isV3OnlyRouteApi(route)

      return {
        routev3: isOnlyV3
          ? new V3Route(route.map(parseV3PoolApi), parsedCurrencyIn, parsedCurrencyOut)
          : null,
        routev2: isOnlyV2
          ? new V2Route(route.map(parseV2PairApi), parsedCurrencyIn, parsedCurrencyOut)
          : null,
        mixedRoute:
          !isOnlyV3 && !isOnlyV2
            ? new MixedRouteSDK(route.map(parseMixedRouteApi), parsedCurrencyIn, parsedCurrencyOut)
            : null,
        inputAmount,
        outputAmount,
      }
    })
  } catch (e) {
    return
  }
}

function parseTokenApi(token: TradingApiTokenInRoute): Token {
  const { address, chainId, decimals, symbol, buyFeeBps, sellFeeBps } = token
  if (!chainId || !address || !decimals || !symbol) {
    throw new Error('Expected token to have chainId, address, decimals, and symbol')
  }
  return new Token(
    chainId,
    address,
    parseInt(decimals.toString(), 10),
    symbol,
    /**name=*/ undefined,
    false,
    buyFeeBps ? BigNumber.from(buyFeeBps) : undefined,
    sellFeeBps ? BigNumber.from(sellFeeBps) : undefined
  )
}

function parseV3PoolApi({
  fee,
  sqrtRatioX96,
  liquidity,
  tickCurrent,
  tokenIn,
  tokenOut,
}: TradingApiV3PoolInRoute): Pool {
  if (!tokenIn || !tokenOut || !fee || !sqrtRatioX96 || !liquidity || !tickCurrent) {
    throw new Error('Expected pool values to be present')
  }
  return new Pool(
    parseTokenApi(tokenIn),
    parseTokenApi(tokenOut),
    parseInt(fee, 10) as FeeAmount,
    sqrtRatioX96,
    liquidity,
    parseInt(tickCurrent, 10)
  )
}

function parseV2PairApi({ reserve0, reserve1 }: TradingApiV2PoolInRoute): Pair {
  if (!reserve0?.token || !reserve1?.token || !reserve0.quotient || !reserve1.quotient) {
    throw new Error('Expected pool values to be present')
  }
  return new Pair(
    CurrencyAmount.fromRawAmount(parseTokenApi(reserve0.token), reserve0.quotient),
    CurrencyAmount.fromRawAmount(parseTokenApi(reserve1.token), reserve1.quotient)
  )
}

function parseMixedRouteApi(pool: TradingApiV2PoolInRoute | TradingApiV3PoolInRoute): Pair | Pool {
  return pool.type === 'v2-pool' ? parseV2PairApi(pool) : parseV3PoolApi(pool)
}

function isV2OnlyRouteApi(route: (TradingApiV2PoolInRoute | TradingApiV3PoolInRoute)[]): boolean {
  return route.every((pool) => pool.type === 'v2-pool')
}

function isV3OnlyRouteApi(route: (TradingApiV2PoolInRoute | TradingApiV3PoolInRoute)[]): boolean {
  return route.every((pool) => pool.type === 'v3-pool')
}

export function getTokenAddressForApiRequest(currency: Maybe<Currency>): string | undefined {
  if (!currency) {
    return undefined
  }
  return currency.isNative ? NATIVE_ADDRESS_FOR_TRADING_API : currency.address
}

const SUPPORTED_TRADING_API_CHAIN_IDS: number[] = Object.values(TradingApiChainId).filter(
  (value): value is number => typeof value === 'number'
)

// Parse any chain id to check if its supported by the API ChainId type
function isTradingApiSupportedChainId(chainId?: number): chainId is TradingApiChainId {
  if (!chainId) {
    return false
  }
  return Object.values(SUPPORTED_TRADING_API_CHAIN_IDS).includes(chainId)
}

export function toTradingApiSupportedChainId(
  chainId: Maybe<number>
): TradingApiChainId | undefined {
  if (!chainId || !isTradingApiSupportedChainId(chainId)) {
    return undefined
  }
  return chainId
}

// Classic quote is a non-uniswap x quote. Forces the type on api responses.
// `route` field doesnt exist on uniswap x quote response, so can be used as the custom type gaurd.
// TODO:tradingapi MOB-2438 https://linear.app/uniswap/issue/MOB-2438/uniswap-x-clean-forced-types-for-classic-quotes
export function isClassicQuote(quote?: Quote): quote is ClassicQuote {
  if (!quote) {
    return false
  }
  return 'route' in quote
}

// TODO:tradingapi MOB-2438 https://linear.app/uniswap/issue/MOB-2438/uniswap-x-clean-forced-types-for-classic-quotes
// Check for trading api type data, then type check for classic quote (non uniswap x quote)
export function getClassicQuoteFromResponse(quoteData?: QuoteData): ClassicQuote | undefined {
  if (!quoteData || quoteData.quoteType === QuoteType.RoutingApi) {
    return undefined
  }
  return isClassicQuote(quoteData.quote?.quote) ? quoteData?.quote.quote : undefined
}

/**
 * The trade object should always have the same currencies and amounts as the form values
 * from state - to avoid bad swap submissions we should invalidate the trade object if there are mismatches.
 */
export function validateTrade({
  trade,
  currencyIn,
  currencyOut,
  exactAmount,
  exactCurrencyField,
  formatter,
}: {
  trade: Trade | null
  currencyIn: Maybe<Currency>
  currencyOut: Maybe<Currency>
  exactAmount: Maybe<CurrencyAmount<Currency>>
  exactCurrencyField: CurrencyField
  formatter: LocalizationContextState
}): Trade<Currency, Currency, TradeType> | null {
  // skip if no valid trade object
  if (!trade || !currencyIn || !currencyOut || !exactAmount) {
    return null
  }

  const inputsMatch = areAddressesEqual(
    currencyIn.wrapped.address,
    trade?.inputAmount.currency.wrapped.address
  )
  const outputsMatch = areAddressesEqual(
    currencyOut.wrapped.address,
    trade.outputAmount.currency.wrapped.address
  )

  // TODO(MOB-3028): check if this logic needs any adjustments once we add UniswapX support.
  // Verify the amount specified in the quote response matches the exact amount from input state
  const exactAmountFromQuote =
    trade.quoteData?.quoteType === QuoteType.RoutingApi
      ? exactCurrencyField === CurrencyField.INPUT
        ? trade.quoteData.quote?.quote
        : trade.quoteData.quote?.amount
      : isClassicQuote(trade.quoteData?.quote?.quote)
      ? exactCurrencyField === CurrencyField.INPUT
        ? trade.quoteData.quote.quote.input?.amount
        : trade.quoteData.quote.quote.output?.amount
      : undefined

  const tokenAddressesMatch = inputsMatch && outputsMatch
  const exactAmountsMatch = exactAmount?.toExact() !== exactAmountFromQuote

  if (!(tokenAddressesMatch && exactAmountsMatch)) {
    logger.error(
      new Error(`Mismatched ${!tokenAddressesMatch ? 'address' : 'exact amount'} in swap trade`),
      {
        tags: { file: 'tradingApi/utils', function: 'validateTrade' },
        extra: {
          formState: {
            currencyIdIn: currencyId(currencyIn),
            currencyIdOut: currencyId(currencyOut),
            exactAmount: exactAmount.toExact(),
            exactCurrencyField,
          },
          tradeProperties: getBaseTradeAnalyticsProperties({ trade, formatter }),
        },
      }
    )

    return null
  }

  return trade
}
