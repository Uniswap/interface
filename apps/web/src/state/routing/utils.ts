/* eslint-disable max-lines */
import { BigNumber } from '@ethersproject/bignumber'
import { MixedRouteSDK } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import {
  DutchOrderInfo,
  DutchOrderInfoJSON,
  DutchOutputJSON,
  PriorityOutputJSON,
  UnsignedPriorityOrderInfo,
  UnsignedPriorityOrderInfoJSON,
  UnsignedV2DutchOrderInfo,
  UnsignedV2DutchOrderInfoJSON,
  UnsignedV3DutchOrderInfo,
  UnsignedV3DutchOrderInfoJSON,
  V3DutchOutputJSON,
} from '@uniswap/uniswapx-sdk'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import { getApproveInfo, getWrapInfo } from 'state/routing/gas'
import {
  ClassicQuoteData,
  ClassicTrade,
  DutchOrderTrade,
  GetQuickQuoteArgs,
  GetQuoteArgs,
  InterfaceTrade,
  isClassicQuoteResponse,
  LimitOrderTrade,
  OffchainOrderType,
  PoolType,
  PreviewTrade,
  PriorityOrderTrade,
  QuoteMethod,
  QuoteState,
  RouterPreference,
  SubmittableTrade,
  SwapFeeInfo,
  SwapRouterNativeAssets,
  TokenInRoute,
  TradeFillType,
  TradeResult,
  URADutchOrderQuoteData,
  URADutchOrderV2QuoteData,
  URADutchOrderV3QuoteData,
  URAPriorityOrderQuoteData,
  URAQuoteResponse,
  URAQuoteType,
  V2DutchOrderTrade,
  V2PoolInRoute,
  V3DutchOrderTrade,
  V3PoolInRoute,
} from 'state/routing/types'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { logger } from 'utilities/src/logger/logger'
import { toSlippagePercent } from 'utils/slippage'

interface RouteResult {
  routev3: V3Route<Currency, Currency> | null
  routev2: V2Route<Currency, Currency> | null
  mixedRoute: MixedRouteSDK<Currency, Currency> | null
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
}

/**
 * Transforms a Routing API quote into an array of routes that can be used to
 * create a `Trade`.
 */
export function computeRoutes(args: GetQuoteArgs, routes: ClassicQuoteData['route']): RouteResult[] | undefined {
  if (routes.length === 0) {
    return []
  }
  const [currencyIn, currencyOut] = getTradeCurrencies({ args, isUniswapXTrade: false, routes })

  try {
    return routes.map((route) => {
      if (route.length === 0) {
        throw new Error('Expected route to have at least one pair or pool')
      }
      const rawAmountIn = route[0].amountIn
      const rawAmountOut = route[route.length - 1].amountOut

      if (!rawAmountIn || !rawAmountOut) {
        throw new Error('Expected both amountIn and amountOut to be present')
      }

      const isOnlyV2 = isVersionedRoute<V2PoolInRoute>(PoolType.V2Pool, route)
      const isOnlyV3 = isVersionedRoute<V3PoolInRoute>(PoolType.V3Pool, route)

      return {
        routev3: isOnlyV3 ? new V3Route(route.map(parsePool), currencyIn, currencyOut) : null,
        routev2: isOnlyV2 ? new V2Route(route.map(parsePair), currencyIn, currencyOut) : null,
        mixedRoute:
          !isOnlyV3 && !isOnlyV2 ? new MixedRouteSDK(route.map(parsePoolOrPair), currencyIn, currencyOut) : null,
        inputAmount: CurrencyAmount.fromRawAmount(currencyIn, rawAmountIn),
        outputAmount: CurrencyAmount.fromRawAmount(currencyOut, rawAmountOut),
      }
    })
  } catch (e) {
    logger.warn('routing/utils', 'computeRoutes', 'Failed to compute routes', { error: e })
    return undefined
  }
}

const parsePoolOrPair = (pool: V3PoolInRoute | V2PoolInRoute): Pool | Pair => {
  return pool.type === PoolType.V3Pool ? parsePool(pool) : parsePair(pool)
}

function isVersionedRoute<T extends V2PoolInRoute | V3PoolInRoute>(
  type: T['type'],
  route: (V3PoolInRoute | V2PoolInRoute)[],
): route is T[] {
  return route.every((pool) => pool.type === type)
}

function toDutchOrderInfo(orderInfoJSON: DutchOrderInfoJSON): DutchOrderInfo {
  const { nonce, input, outputs, exclusivityOverrideBps } = orderInfoJSON
  return {
    ...orderInfoJSON,
    nonce: BigNumber.from(nonce),
    exclusivityOverrideBps: BigNumber.from(exclusivityOverrideBps),
    input: {
      ...input,
      startAmount: BigNumber.from(input.startAmount),
      endAmount: BigNumber.from(input.endAmount),
    },
    outputs: outputs.map((output) => ({
      ...output,
      startAmount: BigNumber.from(output.startAmount),
      endAmount: BigNumber.from(output.endAmount),
    })),
  }
}

function toUnsignedV2DutchOrderInfo(orderInfoJSON: UnsignedV2DutchOrderInfoJSON): UnsignedV2DutchOrderInfo {
  const { nonce, input, outputs } = orderInfoJSON
  return {
    ...orderInfoJSON,
    nonce: BigNumber.from(nonce),
    input: {
      ...input,
      startAmount: BigNumber.from(input.startAmount),
      endAmount: BigNumber.from(input.endAmount),
    },
    outputs: outputs.map((output: DutchOutputJSON) => ({
      ...output,
      startAmount: BigNumber.from(output.startAmount),
      endAmount: BigNumber.from(output.endAmount),
    })),
  }
}

function toUnsignedV3DutchOrderInfo(orderInfoJSON: UnsignedV3DutchOrderInfoJSON): UnsignedV3DutchOrderInfo {
  const { nonce, input, outputs, startingBaseFee } = orderInfoJSON
  return {
    ...orderInfoJSON,
    nonce: BigNumber.from(nonce),
    startingBaseFee: BigNumber.from(startingBaseFee),
    input: {
      ...input,
      startAmount: BigNumber.from(input.startAmount),
      maxAmount: BigNumber.from(input.maxAmount),
      adjustmentPerGweiBaseFee: BigNumber.from(input.adjustmentPerGweiBaseFee),
      curve: {
        relativeBlocks: input.curve.relativeBlocks,
        relativeAmounts: input.curve.relativeAmounts.map((amount) => BigNumber.from(amount).toBigInt()),
      },
    },
    outputs: outputs.map((output: V3DutchOutputJSON) => ({
      ...output,
      startAmount: BigNumber.from(output.startAmount),
      minAmount: BigNumber.from(output.minAmount),
      adjustmentPerGweiBaseFee: BigNumber.from(output.adjustmentPerGweiBaseFee),
      curve: {
        relativeBlocks: output.curve.relativeBlocks,
        relativeAmounts: output.curve.relativeAmounts.map((amount) => BigNumber.from(amount).toBigInt()),
      },
    })),
  }
}

function toUnsignedPriorityOrderInfo(orderInfoJSON: UnsignedPriorityOrderInfoJSON): UnsignedPriorityOrderInfo {
  const { nonce, auctionStartBlock, baselinePriorityFeeWei, input, outputs } = orderInfoJSON

  return {
    ...orderInfoJSON,
    nonce: BigNumber.from(nonce),
    auctionStartBlock: BigNumber.from(auctionStartBlock),
    baselinePriorityFeeWei: BigNumber.from(baselinePriorityFeeWei),

    input: {
      ...input,
      amount: BigNumber.from(input.amount),
      mpsPerPriorityFeeWei: BigNumber.from(input.mpsPerPriorityFeeWei),
    },
    outputs: outputs.map((output: PriorityOutputJSON) => ({
      ...output,
      amount: BigNumber.from(output.amount),
      mpsPerPriorityFeeWei: BigNumber.from(output.mpsPerPriorityFeeWei),
    })),
  }
}

// Prepares the currencies used for the actual Swap (either UniswapX or Universal Router)
// May not match `currencyIn` that the user selected because for ETH inputs in UniswapX, the actual
// swap will use WETH.
function getTradeCurrencies({
  args,
  isUniswapXTrade,
  routes,
}: {
  args: GetQuoteArgs | GetQuickQuoteArgs
  isUniswapXTrade: boolean
  routes?: ClassicQuoteData['route']
}): [Currency, Currency] {
  const {
    tokenInAddress,
    tokenInChainId,
    tokenInDecimals,
    tokenInSymbol,
    tokenOutAddress,
    tokenOutChainId,
    tokenOutDecimals,
    tokenOutSymbol,
  } = args

  const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(tokenInAddress as SwapRouterNativeAssets)
  const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(tokenOutAddress as SwapRouterNativeAssets)

  const serializedTokenIn = routes?.[0]?.[0]?.tokenIn
  const serializedTokenOut = routes?.[0]?.[routes[0]?.length - 1]?.tokenOut

  const currencyIn = tokenInIsNative
    ? nativeOnChain(tokenInChainId)
    : parseToken({
        address: tokenInAddress,
        chainId: tokenInChainId,
        decimals: tokenInDecimals,
        symbol: tokenInSymbol,
        buyFeeBps: serializedTokenIn?.buyFeeBps,
        sellFeeBps: serializedTokenIn?.sellFeeBps,
      })
  const currencyOut = tokenOutIsNative
    ? nativeOnChain(tokenOutChainId)
    : parseToken({
        address: tokenOutAddress,
        chainId: tokenOutChainId,
        decimals: tokenOutDecimals,
        symbol: tokenOutSymbol,
        buyFeeBps: serializedTokenOut?.buyFeeBps,
        sellFeeBps: serializedTokenOut?.sellFeeBps,
      })

  if (!isUniswapXTrade) {
    return [currencyIn, currencyOut]
  }

  return [currencyIn.isNative ? currencyIn.wrapped : currencyIn, currencyOut]
}

function getSwapFee(
  data:
    | ClassicQuoteData
    | URADutchOrderQuoteData
    | URADutchOrderV2QuoteData
    | URADutchOrderV3QuoteData
    | URAPriorityOrderQuoteData,
): SwapFeeInfo | undefined {
  const { portionAmount, portionBips, portionRecipient } = data

  if (!portionAmount || !portionBips || !portionRecipient) {
    return undefined
  }

  return {
    recipient: portionRecipient,
    percent: new Percent(portionBips, BIPS_BASE),
    amount: portionAmount,
  }
}

function getClassicTradeDetails(
  args: GetQuoteArgs,
  data: URAQuoteResponse,
): {
  gasUseEstimate?: number
  gasUseEstimateUSD?: number
  blockNumber?: string
  routes?: RouteResult[]
  swapFee?: SwapFeeInfo
} {
  const classicQuote =
    data.routing === URAQuoteType.CLASSIC ? data.quote : data.allQuotes.find(isClassicQuoteResponse)?.quote

  if (!classicQuote) {
    return {}
  }

  return {
    gasUseEstimate: classicQuote.gasUseEstimate ? parseFloat(classicQuote.gasUseEstimate) : undefined,
    gasUseEstimateUSD: classicQuote.gasUseEstimateUSD ? parseFloat(classicQuote.gasUseEstimateUSD) : undefined,
    blockNumber: classicQuote.blockNumber,
    routes: computeRoutes(args, classicQuote.route),
    swapFee: getSwapFee(classicQuote),
  }
}

export function getUSDCostPerGas(gasUseEstimateUSD?: number, gasUseEstimate?: number): number | undefined {
  // Some sus javascript float math but it's ok because its just an estimate for display purposes
  if (!gasUseEstimateUSD || !gasUseEstimate) {
    return undefined
  }
  return gasUseEstimateUSD / gasUseEstimate
}

export async function transformQuoteToTrade({
  args,
  data,
  quoteMethod,
}: {
  args: GetQuoteArgs
  data: URAQuoteResponse
  quoteMethod: QuoteMethod
}): Promise<TradeResult> {
  const { tradeType, needsWrapIfUniswapX, routerPreference, account, amount, routingType } = args

  const showUniswapXTrade =
    (routingType === URAQuoteType.DUTCH_V2 ||
      routingType === URAQuoteType.DUTCH_V3 ||
      routingType === URAQuoteType.PRIORITY) &&
    routerPreference === RouterPreference.X

  const [currencyIn, currencyOut] = getTradeCurrencies({ args, isUniswapXTrade: showUniswapXTrade })

  if (!isEVMChain(currencyIn.chainId)) {
    throw new Error('chainId must be EVM for routing api paths')
  }

  const { gasUseEstimateUSD, blockNumber, routes, gasUseEstimate, swapFee } = getClassicTradeDetails(args, data)

  const usdCostPerGas = getUSDCostPerGas(gasUseEstimateUSD, gasUseEstimate)

  const approveInfo = await getApproveInfo({
    account,
    currency: currencyIn,
    amount,
    usdCostPerGas,
  })

  const classicTrade = new ClassicTrade({
    v2Routes:
      routes
        ?.filter((r): r is RouteResult & { routev2: NonNullable<RouteResult['routev2']> } => r.routev2 !== null)
        .map(({ routev2, inputAmount, outputAmount }) => ({
          routev2,
          inputAmount,
          outputAmount,
        })) ?? [],
    v3Routes:
      routes
        ?.filter((r): r is RouteResult & { routev3: NonNullable<RouteResult['routev3']> } => r.routev3 !== null)
        .map(({ routev3, inputAmount, outputAmount }) => ({
          routev3,
          inputAmount,
          outputAmount,
        })) ?? [],
    mixedRoutes:
      routes
        ?.filter(
          (r): r is RouteResult & { mixedRoute: NonNullable<RouteResult['mixedRoute']> } => r.mixedRoute !== null,
        )
        .map(({ mixedRoute, inputAmount, outputAmount }) => ({
          mixedRoute,
          inputAmount,
          outputAmount,
        })) ?? [],
    tradeType,
    gasUseEstimateUSD,
    gasUseEstimate,
    approveInfo,
    blockNumber,
    requestId: data.quote.requestId,
    quoteMethod,
    swapFee,
  })

  // If the top-level URA quote type is DUTCH_V1 or DUTCH_V2, then UniswapX is better for the user
  // Or if quote type is PRIORITY, we only use UniswapX
  const isUniswapXBetter =
    data.routing === URAQuoteType.DUTCH_V1 ||
    data.routing === URAQuoteType.DUTCH_V2 ||
    data.routing === URAQuoteType.DUTCH_V3 ||
    data.routing === URAQuoteType.PRIORITY
  if (isUniswapXBetter) {
    const swapFee = getSwapFee(data.quote)
    const wrapInfo = await getWrapInfo({
      needsWrap: needsWrapIfUniswapX,
      account,
      chainId: currencyIn.chainId,
      amount,
      usdCostPerGas,
    })

    if (data.routing === URAQuoteType.DUTCH_V3) {
      const orderInfo = toUnsignedV3DutchOrderInfo(data.quote.orderInfo)
      const uniswapXv3Trade = new V3DutchOrderTrade({
        currencyIn,
        currenciesOut: [currencyOut],
        orderInfo,
        tradeType,
        quoteId: data.quote.quoteId,
        requestId: data.quote.requestId,
        classicGasUseEstimateUSD: classicTrade.totalGasUseEstimateUSD,
        wrapInfo,
        approveInfo,
        deadlineBufferSecs: data.quote.deadlineBufferSecs,
        slippageTolerance: toSlippagePercent(data.quote.slippageTolerance),
        swapFee,
      })

      return {
        state: QuoteState.SUCCESS,
        trade: uniswapXv3Trade,
      }
    } else if (data.routing === URAQuoteType.DUTCH_V2) {
      const orderInfo = toUnsignedV2DutchOrderInfo(data.quote.orderInfo)
      const uniswapXv2Trade = new V2DutchOrderTrade({
        currencyIn,
        currenciesOut: [currencyOut],
        orderInfo,
        tradeType,
        quoteId: data.quote.quoteId,
        requestId: data.quote.requestId,
        classicGasUseEstimateUSD: classicTrade.totalGasUseEstimateUSD,
        wrapInfo,
        approveInfo,
        deadlineBufferSecs: data.quote.deadlineBufferSecs,
        slippageTolerance: toSlippagePercent(data.quote.slippageTolerance),
        swapFee,
      })

      return {
        state: QuoteState.SUCCESS,
        trade: uniswapXv2Trade,
      }
    } else if (data.routing === URAQuoteType.DUTCH_V1) {
      const orderInfo = toDutchOrderInfo(data.quote.orderInfo)
      const uniswapXTrade = new DutchOrderTrade({
        currencyIn,
        currenciesOut: [currencyOut],
        orderInfo,
        tradeType,
        quoteId: data.quote.quoteId,
        requestId: data.quote.requestId,
        classicGasUseEstimateUSD: classicTrade.totalGasUseEstimateUSD,
        wrapInfo,
        approveInfo,
        auctionPeriodSecs: data.quote.auctionPeriodSecs,
        startTimeBufferSecs: data.quote.startTimeBufferSecs,
        deadlineBufferSecs: data.quote.deadlineBufferSecs,
        slippageTolerance: toSlippagePercent(data.quote.slippageTolerance),
        swapFee,
      })

      return {
        state: QuoteState.SUCCESS,
        trade: uniswapXTrade,
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (data.routing === URAQuoteType.PRIORITY) {
      const orderInfo = toUnsignedPriorityOrderInfo(data.quote.orderInfo)
      const priorityOrderTrade = new PriorityOrderTrade({
        currencyIn,
        currenciesOut: [currencyOut],
        orderInfo,
        tradeType,
        approveInfo,
        wrapInfo,
        startTimeBufferSecs: data.quote.startTimeBufferSecs,
        deadlineBufferSecs: data.quote.deadlineBufferSecs,
        slippageTolerance: toSlippagePercent(data.quote.slippageTolerance),
        classicGasUseEstimateUSD: classicTrade.totalGasUseEstimateUSD,
        swapFee,
        quoteId: data.quote.quoteId,
        requestId: data.quote.requestId,
      })

      return {
        state: QuoteState.SUCCESS,
        trade: priorityOrderTrade,
      }
    }
  }

  return { state: QuoteState.SUCCESS, trade: classicTrade }
}

function parseToken({ address, chainId, decimals, symbol, buyFeeBps, sellFeeBps }: TokenInRoute): Token {
  const buyFeeBpsBN = buyFeeBps ? BigNumber.from(buyFeeBps) : undefined
  const sellFeeBpsBN = sellFeeBps ? BigNumber.from(sellFeeBps) : undefined
  return new Token(chainId, address, parseInt(decimals.toString()), symbol, undefined, false, buyFeeBpsBN, sellFeeBpsBN)
}

function parsePool({ fee, sqrtRatioX96, liquidity, tickCurrent, tokenIn, tokenOut }: V3PoolInRoute): Pool {
  return new Pool(
    parseToken(tokenIn),
    parseToken(tokenOut),
    parseInt(fee) as FeeAmount,
    sqrtRatioX96,
    liquidity,
    parseInt(tickCurrent),
  )
}

const parsePair = ({ reserve0, reserve1 }: V2PoolInRoute): Pair =>
  new Pair(
    CurrencyAmount.fromRawAmount(parseToken(reserve0.token), reserve0.quotient),
    CurrencyAmount.fromRawAmount(parseToken(reserve1.token), reserve1.quotient),
  )

// TODO(WEB-2050): Convert other instances of tradeType comparison to use this utility function
export function isExactInput(tradeType: TradeType): boolean {
  return tradeType === TradeType.EXACT_INPUT
}

export function currencyAddressForSwapQuote(currency: Currency): string {
  if (currency.isNative) {
    if (currency.chainId === UniverseChainId.Polygon) {
      return SwapRouterNativeAssets.MATIC
    }
    if (currency.chainId === UniverseChainId.Bnb) {
      return SwapRouterNativeAssets.BNB
    }
    if (currency.chainId === UniverseChainId.Avalanche) {
      return SwapRouterNativeAssets.AVAX
    }
    return SwapRouterNativeAssets.ETH
  }

  return currency.address
}

export function isClassicTrade(trade?: InterfaceTrade): trade is ClassicTrade {
  return trade?.fillType === TradeFillType.Classic
}

export function isPreviewTrade(trade?: InterfaceTrade): trade is PreviewTrade {
  return trade?.fillType === TradeFillType.None
}

export function isSubmittableTrade(trade?: InterfaceTrade): trade is SubmittableTrade {
  return isClassicTrade(trade) || isUniswapXTrade(trade)
}

/* Returns true if trade uses UniswapX protocol. Includes both X swaps and limit orders. */
export function isUniswapXTradeType(
  tradeType?: TradeFillType,
): tradeType is TradeFillType.UniswapX | TradeFillType.UniswapXv2 | TradeFillType.UniswapXv3 {
  return (
    tradeType === TradeFillType.UniswapX ||
    tradeType === TradeFillType.UniswapXv2 ||
    tradeType === TradeFillType.UniswapXv3
  )
}

export function isUniswapXTrade(
  trade?: InterfaceTrade,
): trade is DutchOrderTrade | V2DutchOrderTrade | V3DutchOrderTrade | LimitOrderTrade | PriorityOrderTrade {
  return isUniswapXTradeType(trade?.fillType)
}

/* Returns true if trade is a SWAP on UniswapX, not a limit order */
export function isUniswapXSwapTrade(
  trade?: InterfaceTrade,
): trade is DutchOrderTrade | V2DutchOrderTrade | V3DutchOrderTrade | PriorityOrderTrade {
  return (
    isUniswapXTrade(trade) &&
    (trade.offchainOrderType === OffchainOrderType.DUTCH_AUCTION ||
      trade.offchainOrderType === OffchainOrderType.DUTCH_V2_AUCTION ||
      trade.offchainOrderType === OffchainOrderType.DUTCH_V3_AUCTION ||
      trade.offchainOrderType === OffchainOrderType.PRIORITY_ORDER)
  )
}

export function isLimitTrade(trade?: InterfaceTrade): trade is LimitOrderTrade {
  return isUniswapXTrade(trade) && trade.offchainOrderType === OffchainOrderType.LIMIT_ORDER
}
