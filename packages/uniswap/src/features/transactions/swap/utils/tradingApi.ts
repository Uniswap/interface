import { MixedRouteSDK } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import { BigNumber } from 'ethers/lib/ethers'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { DiscriminatedQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  BridgeQuote,
  ClassicQuote,
  Quote,
  QuoteResponse,
  Routing,
  RoutingPreference,
  ChainId as TradingApiChainId,
  TokenInRoute as TradingApiTokenInRoute,
  V2PoolInRoute as TradingApiV2PoolInRoute,
  V3PoolInRoute as TradingApiV3PoolInRoute,
} from 'uniswap/src/data/tradingApi/__generated__/index'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { BridgeTrade, ClassicTrade, Trade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TradeProtocolPreference } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

const NATIVE_ADDRESS_FOR_TRADING_API = '0x0000000000000000000000000000000000000000'

interface TradingApiResponseToTradeArgs {
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
  deadline: number | undefined
  slippageTolerance: number | undefined
  data: DiscriminatedQuoteResponse | undefined
}

export function transformTradingApiResponseToTrade(params: TradingApiResponseToTradeArgs): Trade | null {
  const { currencyIn, currencyOut, tradeType, deadline, slippageTolerance, data } = params

  switch (data?.routing) {
    case Routing.CLASSIC: {
      const routes = computeRoutes(currencyIn.isNative, currencyOut.isNative, data)

      if (!routes || !deadline) {
        return null
      }

      return new ClassicTrade({
        quote: data,
        deadline,
        slippageTolerance: slippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE,
        v2Routes: routes?.flatMap((r) => (r?.routev2 ? { ...r, routev2: r.routev2 } : [])) ?? [],
        v3Routes: routes?.flatMap((r) => (r?.routev3 ? { ...r, routev3: r.routev3 } : [])) ?? [],
        mixedRoutes: routes?.flatMap((r) => (r?.mixedRoute ? { ...r, mixedRoute: r.mixedRoute } : [])) ?? [],
        tradeType,
      })
    }
    case Routing.DUTCH_V2: {
      const { quote } = data
      // UniswapX backend response does not include decimals; local currencies must be passed to UniswapXTrade rather than tokens parsed from the api response.
      // We validate the token addresses match to ensure the trade is valid.
      if (
        !areAddressesEqual(currencyIn.wrapped.address, quote.orderInfo.input.token) || // UniswapX quotes should use wrapped native as input, rather than the native token
        !areAddressesEqual(getTokenAddressForApi(currencyOut), quote.orderInfo.outputs[0]?.token)
      ) {
        return null
      }

      return new UniswapXTrade({ quote: data, currencyIn, currencyOut, tradeType })
    }
    case Routing.BRIDGE: {
      return new BridgeTrade({ quote: data, currencyIn, currencyOut, tradeType })
    }
    default: {
      return null
    }
  }
}

/**
 * Transforms a trading API quote into an array of routes that can be used to
 * create a `Trade`.
 */
export function computeRoutes(
  tokenInIsNative: boolean,
  tokenOutIsNative: boolean,
  quoteResponse?: QuoteResponse,
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

  const parsedCurrencyIn = tokenInIsNative ? NativeCurrency.onChain(tokenIn.chainId) : parseTokenApi(tokenIn)

  const parsedCurrencyOut = tokenOutIsNative ? NativeCurrency.onChain(tokenOut.chainId) : parseTokenApi(tokenOut)

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
        routev3: isOnlyV3 ? new V3Route(route.map(parseV3PoolApi), parsedCurrencyIn, parsedCurrencyOut) : null,
        routev2: isOnlyV2 ? new V2Route(route.map(parseV2PairApi), parsedCurrencyIn, parsedCurrencyOut) : null,
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
    sellFeeBps ? BigNumber.from(sellFeeBps) : undefined,
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
    parseInt(tickCurrent, 10),
  )
}

function parseV2PairApi({ reserve0, reserve1 }: TradingApiV2PoolInRoute): Pair {
  if (!reserve0?.token || !reserve1?.token || !reserve0.quotient || !reserve1.quotient) {
    throw new Error('Expected pool values to be present')
  }
  return new Pair(
    CurrencyAmount.fromRawAmount(parseTokenApi(reserve0.token), reserve0.quotient),
    CurrencyAmount.fromRawAmount(parseTokenApi(reserve1.token), reserve1.quotient),
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

export function getTokenAddressForApi(currency: Maybe<Currency>): string | undefined {
  if (!currency) {
    return undefined
  }
  return currency.isNative ? NATIVE_ADDRESS_FOR_TRADING_API : currency.address
}

const SUPPORTED_TRADING_API_CHAIN_IDS: number[] = Object.values(TradingApiChainId).filter(
  (value): value is number => typeof value === 'number',
)

// Parse any chain id to check if its supported by the API ChainId type
function isTradingApiSupportedChainId(chainId?: number): chainId is TradingApiChainId {
  if (!chainId) {
    return false
  }
  return Object.values(SUPPORTED_TRADING_API_CHAIN_IDS).includes(chainId)
}

export function toTradingApiSupportedChainId(chainId: Maybe<number>): TradingApiChainId | undefined {
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
export function getClassicQuoteFromResponse(quote?: QuoteResponse): ClassicQuote | undefined {
  return isClassicQuote(quote?.quote) ? quote.quote : undefined
}

export function getBridgeQuoteFromResponse(quote?: QuoteResponse): BridgeQuote | undefined {
  return quote?.routing === Routing.BRIDGE ? quote.quote : undefined
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
}: {
  trade: Trade | null
  currencyIn: Maybe<Currency>
  currencyOut: Maybe<Currency>
  exactAmount: Maybe<CurrencyAmount<Currency>>
  exactCurrencyField: CurrencyField
}): Trade<Currency, Currency, TradeType> | null {
  // skip if no valid trade object
  if (!trade || !currencyIn || !currencyOut || !exactAmount) {
    return null
  }

  const inputsMatch = areAddressesEqual(currencyIn.wrapped.address, trade?.inputAmount.currency.wrapped.address)
  const outputsMatch = areAddressesEqual(currencyOut.wrapped.address, trade.outputAmount.currency.wrapped.address)

  // TODO(MOB-3028): check if this logic needs any adjustments once we add UniswapX support.
  // Verify the amount specified in the quote response matches the exact amount from input state
  const exactAmountFromQuote = isClassicQuote(trade.quote?.quote)
    ? exactCurrencyField === CurrencyField.INPUT
      ? trade.quote.quote.input?.amount
      : trade.quote.quote.output?.amount
    : undefined

  const tokenAddressesMatch = inputsMatch && outputsMatch
  const exactAmountsMatch = exactAmount?.toExact() !== exactAmountFromQuote

  if (!(tokenAddressesMatch && exactAmountsMatch)) {
    logger.error(new Error(`Mismatched ${!tokenAddressesMatch ? 'address' : 'exact amount'} in swap trade`), {
      tags: { file: 'tradingApi/utils', function: 'validateTrade' },
      extra: {
        formState: {
          currencyIdIn: currencyId(currencyIn),
          currencyIdOut: currencyId(currencyOut),
          exactAmount: exactAmount.toExact(),
          exactCurrencyField,
        },
        tradeProperties: trade,
      },
    })

    return null
  }

  return trade
}

// Converts routing preference type to expected type for trading api
export function getRoutingPreferenceForSwapRequest(
  protocolPreference: TradeProtocolPreference | undefined,
  uniswapXEnabled: boolean,
  isBridging: boolean,
  isUSDQuote?: boolean,
): RoutingPreference {
  if (isUSDQuote) {
    return RoutingPreference.CLASSIC
  }

  if (isBridging) {
    return RoutingPreference.BEST_PRICE
  }

  switch (protocolPreference) {
    case TradeProtocolPreference.Default:
      return uniswapXEnabled ? RoutingPreference.BEST_PRICE_V2 : RoutingPreference.CLASSIC
    case TradeProtocolPreference.V2Only:
      return RoutingPreference.V2_ONLY
    case TradeProtocolPreference.V3Only:
      return RoutingPreference.V3_ONLY
    default:
      return RoutingPreference.CLASSIC
  }
}
