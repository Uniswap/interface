/* eslint-disable max-lines */
import { BigNumber } from '@ethersproject/bignumber'
import { MixedRouteSDK } from '@uniswap/router-sdk'
import type { Currency, TradeType } from '@uniswap/sdk-core'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import type { FeeAmount } from '@uniswap/v3-sdk'
import { Pool as V3Pool, Route as V3Route } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Route as V4Route } from '@uniswap/v4-sdk'
import { type ClassicQuoteResponse, type DiscriminatedQuoteResponse, TradingApi } from '@universe/api'
import { DynamicConfigs, getDynamicConfigValue, SwapConfigKey } from '@universe/gating'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  BridgeTrade,
  ChainedActionTrade,
  ClassicTrade,
  PriorityOrderTrade,
  UniswapXV2Trade,
  UniswapXV3Trade,
  UnwrapTrade,
  WrapTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import type { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { DEFAULT_PROTOCOL_OPTIONS, useProtocolsForChain } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import type { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { isWebApp } from 'utilities/src/platform'

export const NATIVE_ADDRESS_FOR_TRADING_API = '0x0000000000000000000000000000000000000000'
export const SWAP_GAS_URGENCY_OVERRIDE = isWebApp ? TradingApi.Urgency.NORMAL : undefined // on Interface, use a normal urgency, else use TradingAPI default

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
    case TradingApi.Routing.CLASSIC: {
      const routes = computeRoutes({
        tokenInIsNative: currencyIn.isNative,
        tokenOutIsNative: currencyOut.isNative,
        quoteResponse: data,
      })

      if (!routes || !deadline) {
        return null
      }

      return new ClassicTrade({
        quote: data,
        deadline,
        v2Routes: routes.flatMap((r) => (r.routev2 ? { ...r, routev2: r.routev2 } : [])),
        v3Routes: routes.flatMap((r) => (r.routev3 ? { ...r, routev3: r.routev3 } : [])),
        v4Routes: routes.flatMap((r) => (r.routev4 ? { ...r, routev4: r.routev4 } : [])),
        mixedRoutes: routes.flatMap((r) => (r.mixedRoute ? { ...r, mixedRoute: r.mixedRoute } : [])),
        tradeType,
      })
    }
    case TradingApi.Routing.PRIORITY:
    case TradingApi.Routing.DUTCH_V3:
    case TradingApi.Routing.DUTCH_V2: {
      const { quote } = data
      // UniswapX backend response does not include decimals; local currencies must be passed to UniswapXTrade rather than tokens parsed from the api response.
      // We validate the token addresses match to ensure the trade is valid.
      if (
        !areAddressesEqual({
          addressInput1: { address: currencyIn.wrapped.address, chainId: currencyIn.chainId },
          addressInput2: { address: quote.orderInfo.input.token, chainId: currencyIn.chainId },
        }) || // UniswapX quotes should use wrapped native as input, rather than the native token
        !areAddressesEqual({
          addressInput1: { address: getTokenAddressForApi(currencyOut), chainId: currencyOut.chainId },
          addressInput2: { address: quote.orderInfo.outputs[0]?.token, chainId: currencyOut.chainId },
        })
      ) {
        return null
      }

      const isPriority = data.routing === TradingApi.Routing.PRIORITY
      if (isPriority) {
        return new PriorityOrderTrade({ quote: data, currencyIn, currencyOut, tradeType })
      } else if (data.routing === TradingApi.Routing.DUTCH_V2) {
        return new UniswapXV2Trade({ quote: data, currencyIn, currencyOut, tradeType })
      } else {
        return new UniswapXV3Trade({ quote: data, currencyIn, currencyOut, tradeType })
      }
    }
    case TradingApi.Routing.BRIDGE: {
      return new BridgeTrade({ quote: data, currencyIn, currencyOut, tradeType })
    }
    case TradingApi.Routing.WRAP: {
      return new WrapTrade({ quote: data, currencyIn, currencyOut, tradeType })
    }
    case TradingApi.Routing.UNWRAP: {
      return new UnwrapTrade({ quote: data, currencyIn, currencyOut, tradeType })
    }
    case TradingApi.Routing.CHAINED: {
      return new ChainedActionTrade({ quote: data, currencyIn, currencyOut })
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
function computeRoutes({
  tokenInIsNative,
  tokenOutIsNative,
  quoteResponse,
}: {
  tokenInIsNative: boolean
  tokenOutIsNative: boolean
  quoteResponse?: ClassicQuoteResponse
}):
  | {
      routev4: V4Route<Currency, Currency> | null
      routev3: V3Route<Currency, Currency> | null
      routev2: V2Route<Currency, Currency> | null
      mixedRoute: MixedRouteSDK<Currency, Currency> | null
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
  | undefined {
  if (!quoteResponse) {
    return undefined
  }

  const { quote } = quoteResponse

  if (!quote.route || quote.route.length === 0) {
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

  const parsedCurrencyIn = tokenInIsNative ? nativeOnChain(tokenIn.chainId) : parseTokenApi(tokenIn)

  const parsedCurrencyOut = tokenOutIsNative ? nativeOnChain(tokenOut.chainId) : parseTokenApi(tokenOut)

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

      const v4Routes = route.filter((r): r is TradingApi.V4PoolInRoute => r.type === 'v4-pool')

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
        input: currencyAddress(parsedCurrencyIn),
        output: currencyAddress(parsedCurrencyOut),
        inputChainId: parsedCurrencyIn.chainId,
        outputChainId: parsedCurrencyOut.chainId,
      },
    })
    return undefined
  }
}

function parseTokenApi(token: TradingApi.TokenInRoute): Token {
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
}: TradingApi.V4PoolInRoute): V4Pool {
  if (!tokenIn.address || !tokenOut.address || !tokenIn.chainId || !tokenOut.chainId) {
    throw new Error('Expected V4 route to have defined addresses and chainIds')
  }

  const inputIsNative = tokenIn.address === NATIVE_ADDRESS_FOR_TRADING_API
  const outputIsNative = tokenOut.address === NATIVE_ADDRESS_FOR_TRADING_API

  // Unlike lower protocol versions, v4 routes can involve unwrapped native tokens.
  const currencyIn = inputIsNative ? nativeOnChain(tokenIn.chainId) : parseTokenApi(tokenIn)
  const currencyOut = outputIsNative ? nativeOnChain(tokenOut.chainId) : parseTokenApi(tokenOut)

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
}: TradingApi.V3PoolInRoute): V3Pool {
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

function parseV2PairApi({ reserve0, reserve1 }: TradingApi.V2PoolInRoute): Pair {
  if (!reserve0?.token || !reserve1?.token || !reserve0.quotient || !reserve1.quotient) {
    throw new Error('Expected pool values to be present')
  }
  return new Pair(
    CurrencyAmount.fromRawAmount(parseTokenApi(reserve0.token), reserve0.quotient),
    CurrencyAmount.fromRawAmount(parseTokenApi(reserve1.token), reserve1.quotient),
  )
}

type ClassicPoolInRoute = TradingApi.V2PoolInRoute | TradingApi.V3PoolInRoute | TradingApi.V4PoolInRoute
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

function isV2Pool(pool: ClassicPoolInRoute): pool is TradingApi.V2PoolInRoute {
  return pool.type === 'v2-pool'
}

function isV3Pool(pool: ClassicPoolInRoute): pool is TradingApi.V3PoolInRoute {
  return pool.type === 'v3-pool'
}

function isV4Pool(pool: ClassicPoolInRoute): pool is TradingApi.V4PoolInRoute {
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

const SUPPORTED_TRADING_API_CHAIN_IDS: number[] = Object.values(TradingApi.ChainId).filter(
  (value): value is number => typeof value === 'number',
)

// Parse any chain id to check if its supported by the API ChainId type
function isTradingApiSupportedChainId(chainId?: number): chainId is TradingApi.ChainId {
  if (!chainId) {
    return false
  }
  return Object.values(SUPPORTED_TRADING_API_CHAIN_IDS).includes(chainId)
}

export function toTradingApiSupportedChainId(chainId: Maybe<number>): TradingApi.ChainId | undefined {
  if (!chainId || !isTradingApiSupportedChainId(chainId)) {
    return undefined
  }
  return chainId
}

export function getClassicQuoteFromResponse(
  quote?: ClassicQuoteResponse | { routing: Exclude<TradingApi.Routing, TradingApi.Routing.CLASSIC> },
): TradingApi.ClassicQuote | undefined {
  if (quote && isClassic(quote)) {
    return quote.quote
  }
  return undefined
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

  const inputsMatch = areAddressesEqual({
    addressInput1: { address: currencyIn.wrapped.address, chainId: currencyIn.chainId },
    addressInput2: { address: trade.inputAmount.currency.wrapped.address, chainId: trade.inputAmount.currency.chainId },
  })
  const outputsMatch = areAddressesEqual({
    addressInput1: { address: currencyOut.wrapped.address, chainId: currencyOut.chainId },
    addressInput2: {
      address: trade.outputAmount.currency.wrapped.address,
      chainId: trade.outputAmount.currency.chainId,
    },
  })

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
  isV4HookPoolsEnabled?: boolean
}

export type QuoteRoutingParamsResult = Pick<TradingApi.QuoteRequest, 'routingPreference' | 'protocols' | 'hooksOptions'>

export function useQuoteRoutingParams({
  selectedProtocols,
  tokenInChainId,
  tokenOutChainId,
  isUSDQuote,
  isV4HookPoolsEnabled = true,
}: UseQuoteRoutingParamsArgs): QuoteRoutingParamsResult {
  const inputChainProtocols = useProtocolsForChain(selectedProtocols ?? DEFAULT_PROTOCOL_OPTIONS, tokenInChainId)
  const outputChainProtocols = useProtocolsForChain(selectedProtocols ?? DEFAULT_PROTOCOL_OPTIONS, tokenOutChainId)

  const getQuoteRoutingParams = createGetQuoteRoutingParams({
    getProtocols: () => Array.from(new Set([...inputChainProtocols, ...outputChainProtocols])),
    getIsV4HookPoolsEnabled: () => isV4HookPoolsEnabled,
  })

  return getQuoteRoutingParams({ isUSDQuote })
}

export type GetQuoteRoutingParams = (input: Pick<UseQuoteRoutingParamsArgs, 'isUSDQuote'>) => QuoteRoutingParamsResult

export function createGetQuoteRoutingParams(ctx: {
  getProtocols: () => ReturnType<typeof useProtocolsForChain>
  getIsV4HookPoolsEnabled: () => boolean
}): GetQuoteRoutingParams {
  return (input) => {
    const { isUSDQuote } = input
    // for USD quotes, we avoid routing through UniswapX
    // hooksOptions should not be sent for USD quotes
    if (isUSDQuote) {
      return {
        protocols: [TradingApi.ProtocolItems.V2, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V4],
      }
    }

    const protocols = ctx.getProtocols()

    let finalProtocols = [...protocols]
    let hooksOptions: TradingApi.HooksOptions

    const isV4HookPoolsEnabled = ctx.getIsV4HookPoolsEnabled()

    if (isV4HookPoolsEnabled) {
      if (!protocols.includes(TradingApi.ProtocolItems.V4)) {
        finalProtocols = [...protocols, TradingApi.ProtocolItems.V4] // we need to re-add v4 to protocols if v4 hooks is toggled on
        hooksOptions = TradingApi.HooksOptions.V4_HOOKS_ONLY
      } else {
        hooksOptions = TradingApi.HooksOptions.V4_HOOKS_INCLUSIVE
      }
    } else {
      hooksOptions = TradingApi.HooksOptions.V4_NO_HOOKS
    }

    return { protocols: finalProtocols, hooksOptions }
  }
}

// Used if dynamic config value fails to resolve
const DEFAULT_L2_SLIPPAGE_TOLERANCE_VALUE = 2.5

export function getMinAutoSlippageToleranceL2(): number {
  return getDynamicConfigValue({
    config: DynamicConfigs.Swap,
    key: SwapConfigKey.MinAutoSlippageToleranceL2,
    defaultValue: DEFAULT_L2_SLIPPAGE_TOLERANCE_VALUE,
  })
}

type GetQuoteSlippageParamsArgs = {
  tokenInChainId: UniverseChainId | undefined
  tokenOutChainId: UniverseChainId | undefined
  isUSDQuote?: boolean
}

export type QuoteSlippageParamsResult = Pick<TradingApi.QuoteRequest, 'autoSlippage' | 'slippageTolerance'> | undefined

export type GetQuoteSlippageParams = (input: GetQuoteSlippageParamsArgs) => QuoteSlippageParamsResult

export function createGetQuoteSlippageParams(ctx: {
  getMinAutoSlippageToleranceL2: () => number
  getIsL2ChainId: (chainId?: UniverseChainId) => boolean
  getCustomSlippageTolerance: () => number | undefined
}): GetQuoteSlippageParams {
  return function getQuoteSlippageParams(input: GetQuoteSlippageParamsArgs): QuoteSlippageParamsResult {
    const { tokenInChainId, tokenOutChainId, isUSDQuote } = input
    const customSlippageTolerance = ctx.getCustomSlippageTolerance()
    if (customSlippageTolerance) {
      return { slippageTolerance: customSlippageTolerance }
    }

    // For bridging or USD quotes, we do not apply any slippage settings
    if (tokenInChainId !== tokenOutChainId || isUSDQuote) {
      return undefined
    }

    // L2 chains should use the minimum slippage tolerance defined in the dynamic config
    if (ctx.getIsL2ChainId(tokenInChainId)) {
      return { slippageTolerance: ctx.getMinAutoSlippageToleranceL2() }
    }

    // Otherwise, use an auto slippage tolerance calculated on the backend
    // TODO: TradingApi.AutoSlippage.DEFAULT was removed. Verify if there is a replacement.
    return { autoSlippage: 'DEFAULT' }
  }
}

export function tradingApiToUniverseChainId(chainId?: TradingApi.ChainId): UniverseChainId | undefined {
  if (!chainId) {
    return undefined
  }

  const castedChainId = Number(chainId)
  return isUniverseChainId(castedChainId) ? castedChainId : undefined
}
