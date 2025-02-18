/* eslint-disable max-lines */
import { MixedRouteSDK } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { FeeAmount, Pool as V3Pool, Route as V3Route } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Route as V4Route } from '@uniswap/v4-sdk'
import { BigNumber } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { DiscriminatedQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  AutoSlippage,
  BridgeQuote,
  ClassicQuote,
  ProtocolItems,
  Quote,
  QuoteRequest,
  QuoteResponse,
  Routing,
  RoutingPreference,
  ChainId as TradingApiChainId,
  TokenInRoute as TradingApiTokenInRoute,
  V2PoolInRoute as TradingApiV2PoolInRoute,
  V3PoolInRoute as TradingApiV3PoolInRoute,
  V4PoolInRoute as TradingApiV4PoolInRoute,
  Urgency,
  V4PoolInRoute,
} from 'uniswap/src/data/tradingApi/__generated__/index'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import {
  BridgeTrade,
  ClassicTrade,
  PriorityOrderTrade,
  Trade,
  UniswapXV2Trade,
  UniswapXV3Trade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  FrontendSupportedProtocol,
  useProtocolsForChain,
} from 'uniswap/src/features/transactions/swap/utils/protocols'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { isInterface } from 'utilities/src/platform'

export const NATIVE_ADDRESS_FOR_TRADING_API = '0x0000000000000000000000000000000000000000'
export const SWAP_GAS_URGENCY_OVERRIDE = isInterface ? Urgency.NORMAL : undefined // on Interface, use a normal urgency, else use TradingAPI default

interface TradingApiResponseToTradeArgs {
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
  deadline: number | undefined
  data: DiscriminatedQuoteResponse | undefined
}

export function transformTradingApiResponseToTrade(params: TradingApiResponseToTradeArgs): Trade | null {
  const { currencyIn, currencyOut, tradeType, deadline, data } = params

  switch (data?.routing) {
    case Routing.CLASSIC: {
      const routes = computeRoutes(currencyIn.isNative, currencyOut.isNative, data)

      if (!routes || !deadline) {
        return null
      }

      return new ClassicTrade({
        quote: data,
        deadline,
        v2Routes: routes?.flatMap((r) => (r?.routev2 ? { ...r, routev2: r.routev2 } : [])) ?? [],
        v3Routes: routes?.flatMap((r) => (r?.routev3 ? { ...r, routev3: r.routev3 } : [])) ?? [],
        v4Routes: routes?.flatMap((r) => (r?.routev4 ? { ...r, routev4: r.routev4 } : [])) ?? [],
        mixedRoutes: routes?.flatMap((r) => (r?.mixedRoute ? { ...r, mixedRoute: r.mixedRoute } : [])) ?? [],
        tradeType,
      })
    }
    case Routing.PRIORITY:
    case Routing.DUTCH_V3:
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

      const isPriority = data.routing === Routing.PRIORITY
      if (isPriority) {
        return new PriorityOrderTrade({ quote: data, currencyIn, currencyOut, tradeType })
      } else if (data.routing === Routing.DUTCH_V2) {
        return new UniswapXV2Trade({ quote: data, currencyIn, currencyOut, tradeType })
      } else {
        return new UniswapXV3Trade({ quote: data, currencyIn, currencyOut, tradeType })
      }
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
      routev4: V4Route<Currency, Currency> | null
      routev3: V3Route<Currency, Currency> | null
      routev2: V2Route<Currency, Currency> | null
      mixedRoute: MixedRouteSDK<Currency, Currency> | null
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
  | undefined {
  // TODO : remove quote type check for Uniswap X integration
  if (!quoteResponse || !quoteResponse.quote || !isClassicQuote(quoteResponse.quote)) {
    return undefined
  }

  const { quote } = quoteResponse

  if (!quote.route || quote.route?.length === 0) {
    return undefined
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
      const isOnlyV4 = isV4OnlyRouteApi(route)

      const v4Routes = route.filter((r): r is V4PoolInRoute => r.type === 'v4-pool')

      return {
        routev4: isOnlyV4 ? new V4Route(v4Routes.map(parseV4PoolApi), parsedCurrencyIn, parsedCurrencyOut) : null,
        routev3: isOnlyV3 ? new V3Route(route.map(parseV3PoolApi), parsedCurrencyIn, parsedCurrencyOut) : null,
        routev2: isOnlyV2 ? new V2Route(route.map(parseV2PairApi), parsedCurrencyIn, parsedCurrencyOut) : null,
        mixedRoute:
          !isOnlyV3 && !isOnlyV2 && !isOnlyV4
            ? new MixedRouteSDK(route.map(parseMixedRouteApi), parsedCurrencyIn, parsedCurrencyOut)
            : null,
        inputAmount,
        outputAmount,
      }
    })
  } catch (e) {
    logger.error(e, {
      tags: { file: 'tradingApi.ts', function: 'computeRoutes' },
      extra: {
        input: parsedCurrencyIn.address,
        output: parsedCurrencyOut.address,
        inputChainId: parsedCurrencyIn.chainId,
        outputChainId: parsedCurrencyOut.chainId,
      },
    })
    return undefined
  }
}

function parseTokenApi(token: TradingApiTokenInRoute): Token {
  const { address, chainId, decimals, symbol, buyFeeBps, sellFeeBps } = token
  if (!chainId || !address || !decimals || !symbol) {
    throw new Error('Expected token to have chainId, address, decimals, and symbol')
  }

  if (address === NATIVE_ADDRESS_FOR_TRADING_API) {
    throw new Error('Cannot parse native currency as an erc20 Token')
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

function parseV4PoolApi({
  fee,
  sqrtRatioX96,
  liquidity,
  tickCurrent,
  tickSpacing,
  hooks,
  tokenIn,
  tokenOut,
}: TradingApiV4PoolInRoute): V4Pool {
  if (!tokenIn.address || !tokenOut.address || !tokenIn.chainId || !tokenOut.chainId) {
    throw new Error('Expected V4 route to have defined addresses and chainIds')
  }

  const inputIsNative = tokenIn.address === NATIVE_ADDRESS_FOR_TRADING_API
  const outputIsNative = tokenOut.address === NATIVE_ADDRESS_FOR_TRADING_API

  // Unlike lower protocol versions, v4 routes can involve unwrapped native tokens.
  const currencyIn = inputIsNative ? NativeCurrency.onChain(tokenIn.chainId) : parseTokenApi(tokenIn)
  const currencyOut = outputIsNative ? NativeCurrency.onChain(tokenOut.chainId) : parseTokenApi(tokenOut)

  return new V4Pool(
    currencyIn,
    currencyOut,
    Number(fee),
    Number(tickSpacing),
    hooks,
    sqrtRatioX96,
    liquidity,
    Number(tickCurrent),
  )
}

function parseV3PoolApi({
  fee,
  sqrtRatioX96,
  liquidity,
  tickCurrent,
  tokenIn,
  tokenOut,
}: TradingApiV3PoolInRoute): V3Pool {
  if (!tokenIn || !tokenOut || !fee || !sqrtRatioX96 || !liquidity || !tickCurrent) {
    throw new Error('Expected pool values to be present')
  }
  return new V3Pool(
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

type ClassicPoolInRoute = TradingApiV2PoolInRoute | TradingApiV3PoolInRoute | TradingApiV4PoolInRoute
function parseMixedRouteApi(pool: ClassicPoolInRoute): Pair | V3Pool | V4Pool {
  if (isV2Pool(pool)) {
    return parseV2PairApi(pool)
  } else if (isV3Pool(pool)) {
    return parseV3PoolApi(pool)
  } else if (isV4Pool(pool)) {
    return parseV4PoolApi(pool)
  }
  throw new Error('Invalid pool type')
}

function isV2Pool(pool: ClassicPoolInRoute): pool is TradingApiV2PoolInRoute {
  return pool.type === 'v2-pool'
}

function isV3Pool(pool: ClassicPoolInRoute): pool is TradingApiV3PoolInRoute {
  return pool.type === 'v3-pool'
}

function isV4Pool(pool: ClassicPoolInRoute): pool is TradingApiV4PoolInRoute {
  return pool.type === 'v4-pool'
}

function isV2OnlyRouteApi(route: ClassicPoolInRoute[]): boolean {
  return route.every(isV2Pool)
}

function isV3OnlyRouteApi(route: ClassicPoolInRoute[]): boolean {
  return route.every(isV3Pool)
}

function isV4OnlyRouteApi(route: ClassicPoolInRoute[]): boolean {
  return route.every(isV4Pool)
}

export function getTokenAddressFromChainForTradingApi(address: Address, chainId: UniverseChainId): string {
  // For native currencies, we need to map to 0x0000000000000000000000000000000000000000
  if (address === getChainInfo(chainId).nativeCurrency.address) {
    return NATIVE_ADDRESS_FOR_TRADING_API
  }
  return address
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

  const tokenAddressesMatch = inputsMatch && outputsMatch
  // TODO(WEB-5132): Add validation checking that exact amount from response matches exact amount from user input
  if (!tokenAddressesMatch) {
    logger.error(new Error(`Mismatched address in swap trade`), {
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

type UseQuoteRoutingParamsArgs = {
  selectedProtocols: FrontendSupportedProtocol[] | undefined
  tokenInChainId: UniverseChainId | undefined
  tokenOutChainId: UniverseChainId | undefined
  isUSDQuote?: boolean
}

export function useQuoteRoutingParams({
  selectedProtocols,
  tokenInChainId,
  tokenOutChainId,
  isUSDQuote,
}: UseQuoteRoutingParamsArgs): Pick<QuoteRequest, 'routingPreference' | 'protocols'> {
  const protocols = useProtocolsForChain(selectedProtocols ?? DEFAULT_PROTOCOL_OPTIONS, tokenInChainId)

  return useMemo(() => {
    // for USD quotes, we avoid routing through UniswapX
    if (isUSDQuote) {
      return {
        protocols: [ProtocolItems.V2, ProtocolItems.V3, ProtocolItems.V4],
      }
    }

    // for bridging, we want to only return BEST_PRICE
    if (tokenInChainId !== tokenOutChainId) {
      return { routingPreference: RoutingPreference.BEST_PRICE }
    }

    // For normal quotes, we only need to specify protocols
    return { protocols }
  }, [isUSDQuote, tokenInChainId, tokenOutChainId, protocols])
}

type UseQuoteSlippageParamsArgs = {
  customSlippageTolerance: number | undefined
  tokenInChainId: UniverseChainId | undefined
  tokenOutChainId: UniverseChainId | undefined
  isUSDQuote?: boolean
}

// Used if dynamic config value fails to resolve
const DEFAULT_L2_SLIPPAGE_TOLERANCE_VALUE = 2.5

export function useQuoteSlippageParams({
  customSlippageTolerance,
  tokenInChainId,
  tokenOutChainId,
  isUSDQuote,
}: UseQuoteSlippageParamsArgs): Pick<QuoteRequest, 'autoSlippage' | 'slippageTolerance'> | undefined {
  const minAutoSlippageToleranceL2 = useDynamicConfigValue(
    DynamicConfigs.Swap,
    SwapConfigKey.MinAutoSlippageToleranceL2,
    DEFAULT_L2_SLIPPAGE_TOLERANCE_VALUE,
  )

  return useMemo(() => {
    if (customSlippageTolerance) {
      return { slippageTolerance: customSlippageTolerance }
    }

    // For bridging or USD quotes, we do not apply any slippage settings
    if (tokenInChainId !== tokenOutChainId || isUSDQuote) {
      return undefined
    }

    // L2 chains should use the minimum slippage tolerance defined in the dynamic config
    if (isL2ChainId(tokenInChainId)) {
      return { slippageTolerance: minAutoSlippageToleranceL2 }
    }

    // Otherwise, use an auto slippage tolerance calculated on the backend
    return { autoSlippage: AutoSlippage.DEFAULT }
  }, [customSlippageTolerance, isUSDQuote, minAutoSlippageToleranceL2, tokenInChainId, tokenOutChainId])
}
