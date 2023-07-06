import { BigNumber } from '@ethersproject/bignumber'
import { DutchOrderInfo, DutchOrderInfoJSON } from '@uniswap/gouda-sdk'
import { MaxUint256 } from '@uniswap/permit2-sdk'
import { MixedRouteSDK } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { AlphaRouter, ChainId } from '@uniswap/smart-order-router'
import { PERMIT2_ADDRESS } from '@uniswap/universal-router-sdk'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import ERC20_ABI from 'abis/erc20.json'
import { Erc20, Weth } from 'abis/types'
import WETH_ABI from 'abis/weth.json'
import { SupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { isBsc, isMatic, nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { toSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import { getContract } from 'utils'
import { toSlippagePercent } from 'utils/slippage'

import { GetQuoteArgs, INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference } from './slice'
import {
  ApproveInfo,
  ClassicQuoteData,
  ClassicTrade,
  DutchOrderTrade,
  InterfaceTrade,
  isClassicQuoteResponse,
  PoolType,
  QuoteMethod,
  QuoteState,
  SwapRouterNativeAssets,
  TradeFillType,
  TradeResult,
  URAQuoteResponse,
  URAQuoteType,
  V2PoolInRoute,
  V3PoolInRoute,
  WrapInfo,
} from './types'

interface RouteResult {
  routev3: V3Route<Currency, Currency> | null
  routev2: V2Route<Currency, Currency> | null
  mixedRoute: MixedRouteSDK<Currency, Currency> | null
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
}

const routers = new Map<ChainId, AlphaRouter>()
export function getRouter(chainId: ChainId): AlphaRouter {
  const router = routers.get(chainId)
  if (router) return router

  const supportedChainId = toSupportedChainId(chainId)
  if (supportedChainId) {
    const provider = RPC_PROVIDERS[supportedChainId]
    const router = new AlphaRouter({ chainId, provider })
    routers.set(chainId, router)
    return router
  }

  throw new Error(`Router does not support this chain (chainId: ${chainId}).`)
}

/**
 * Transforms a Routing API quote into an array of routes that can be used to
 * create a `Trade`.
 */
export function computeRoutes(
  currencyIn: Currency,
  currencyOut: Currency,
  routes: ClassicQuoteData['route']
): RouteResult[] | undefined {
  if (routes.length === 0) return []

  const tokenIn = routes[0]?.[0]?.tokenIn
  const tokenOut = routes[0]?.[routes[0]?.length - 1]?.tokenOut
  if (!tokenIn || !tokenOut) throw new Error('Expected both tokenIn and tokenOut to be present')

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
    console.error('Error computing routes', e)
    return
  }
}

const parsePoolOrPair = (pool: V3PoolInRoute | V2PoolInRoute): Pool | Pair => {
  return pool.type === PoolType.V3Pool ? parsePool(pool) : parsePair(pool)
}

function isVersionedRoute<T extends V2PoolInRoute | V3PoolInRoute>(
  type: T['type'],
  route: (V3PoolInRoute | V2PoolInRoute)[]
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

// Prepares the currencies used for the actual Swap (either Gouda or Universal Router)
// May not match `currencyIn` that the user selected because for ETH inputs in Gouda, the actual
// swap will use WETH.
function getTradeCurrencies(args: GetQuoteArgs, isUniswapXTrade: boolean): [Currency, Currency] {
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

  const currencyIn = tokenInIsNative
    ? nativeOnChain(tokenInChainId)
    : parseToken({ address: tokenInAddress, chainId: tokenInChainId, decimals: tokenInDecimals, symbol: tokenInSymbol })
  const currencyOut = tokenOutIsNative
    ? nativeOnChain(tokenOutChainId)
    : parseToken({
        address: tokenOutAddress,
        chainId: tokenOutChainId,
        decimals: tokenOutDecimals,
        symbol: tokenOutSymbol,
      })

  if (!isUniswapXTrade) {
    return [currencyIn, currencyOut]
  }

  return [currencyIn.isNative ? currencyIn.wrapped : currencyIn, currencyOut]
}

function getClassicTradeDetails(
  currencyIn: Currency,
  currencyOut: Currency,
  data: URAQuoteResponse
): {
  gasUseEstimate?: number
  gasUseEstimateUSD?: number
  blockNumber?: string
  routes?: RouteResult[]
} {
  const classicQuote =
    data.routing === URAQuoteType.CLASSIC ? data.quote : data.allQuotes.find(isClassicQuoteResponse)?.quote
  return {
    gasUseEstimate: classicQuote?.gasUseEstimate ? parseFloat(classicQuote.gasUseEstimate) : undefined,
    gasUseEstimateUSD: classicQuote?.gasUseEstimateUSD ? parseFloat(classicQuote.gasUseEstimateUSD) : undefined,
    blockNumber: classicQuote?.blockNumber,
    routes: classicQuote ? computeRoutes(currencyIn, currencyOut, classicQuote.route) : undefined,
  }
}

// TODO (Gouda): add fallback gas limits per chain? l2s have higher costs
const WRAP_FALLBACK_GAS_LIMIT = 45_000
const APPROVE_FALLBACK_GAS_LIMIT = 65_000

async function getApproveInfo(
  account: string | undefined,
  currency: Currency,
  amount: string,
  usdCostPerGas?: number
): Promise<ApproveInfo> {
  // native currencies do not need token approvals
  if (currency.isNative) return { needsApprove: false }

  // If any of these arguments aren't provided, then we cannot generate approval cost info
  if (!account || !usdCostPerGas) return { needsApprove: false }

  const provider = RPC_PROVIDERS[currency.chainId as SupportedChainId]
  const tokenContract = getContract(currency.address, ERC20_ABI, provider) as Erc20

  const allowance = await tokenContract.callStatic.allowance(account, PERMIT2_ADDRESS)
  if (!allowance.lt(amount)) return { needsApprove: false }

  const approveTx = await tokenContract.populateTransaction.approve(PERMIT2_ADDRESS, MaxUint256)
  let approveGasUseEstimate
  try {
    approveGasUseEstimate = (await provider.estimateGas({ from: account, ...approveTx })).toNumber()
  } catch (_) {
    // estimateGas will error if the account doesn't have sufficient token balance, but we should show an estimated cost anyway
    approveGasUseEstimate = APPROVE_FALLBACK_GAS_LIMIT
  }

  return { needsApprove: true, approveGasEstimateUSD: approveGasUseEstimate * usdCostPerGas }
}

async function getWrapInfo(
  needsWrap: boolean,
  account: string | undefined,
  chainId: SupportedChainId,
  amount: string,
  usdCostPerGas?: number
): Promise<WrapInfo> {
  if (!needsWrap) return { needsWrap: false }

  const provider = RPC_PROVIDERS[chainId]
  const wethAddress = WRAPPED_NATIVE_CURRENCY[chainId]?.address

  // If any of these arguments aren't provided, then we cannot generate wrap cost info
  if (!wethAddress || !usdCostPerGas) return { needsWrap: false }

  const wethContract = getContract(wethAddress, WETH_ABI, provider, account) as Weth
  const wethTx = await wethContract.populateTransaction.deposit({ value: amount })
  let wrapGasUseEstimate
  try {
    // estimateGas will error if the account doesn't have sufficient ETH balance, but we should show an estimated cost anyway
    wrapGasUseEstimate = (await provider.estimateGas({ from: account, ...wethTx })).toNumber()
  } catch (_) {
    wrapGasUseEstimate = WRAP_FALLBACK_GAS_LIMIT
  }

  return { needsWrap: true, wrapGasEstimateUSD: wrapGasUseEstimate * usdCostPerGas }
}

export async function transformRoutesToTrade(
  args: GetQuoteArgs,
  data: URAQuoteResponse,
  quoteMethod: QuoteMethod
): Promise<TradeResult> {
  const { tradeType, needsWrapIfUniswapX, routerPreference, account, amount } = args

  // During the opt-in period, only return Gouda quotes if the user has turned on the setting,
  // even if it is the better quote.
  const showUniswapXTrade = data.routing === URAQuoteType.DUTCH_LIMIT && routerPreference === RouterPreference.X

  const [currencyIn, currencyOut] = getTradeCurrencies(args, showUniswapXTrade)
  const { gasUseEstimateUSD, blockNumber, routes, gasUseEstimate } = getClassicTradeDetails(
    currencyIn,
    currencyOut,
    data
  )

  // If the top-level URA quote type is DUTCH_LIMIT, then UniswapX is better for the user
  const isUniswapXBetter = data.routing === URAQuoteType.DUTCH_LIMIT

  // Some sus javascript float math but it's ok because its just an estimate for display purposes
  const usdCostPerGas = gasUseEstimateUSD && gasUseEstimate ? gasUseEstimateUSD / gasUseEstimate : undefined

  const approveInfo = await getApproveInfo(account, currencyIn, amount, usdCostPerGas)
  let uniswapXGasUseEstimateUSD: number | undefined
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
          (r): r is RouteResult & { mixedRoute: NonNullable<RouteResult['mixedRoute']> } => r.mixedRoute !== null
        )
        .map(({ mixedRoute, inputAmount, outputAmount }) => ({
          mixedRoute,
          inputAmount,
          outputAmount,
        })) ?? [],
    tradeType,
    gasUseEstimateUSD,
    approveInfo,
    blockNumber,
    isUniswapXBetter,
    requestId: data.quote.requestId,
    quoteMethod,
  })

  if (isUniswapXBetter) {
    const orderInfo = toDutchOrderInfo(data.quote.orderInfo)
    const wrapInfo = await getWrapInfo(needsWrapIfUniswapX, account, currencyIn.chainId, amount, usdCostPerGas)

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
      deadlineBufferSecs: data.quote.deadlineBufferSecs,
      slippageTolerance: toSlippagePercent(data.quote.slippageTolerance),
    })

    uniswapXGasUseEstimateUSD = uniswapXTrade.totalGasUseEstimateUSD

    // During the opt-in period, only return Gouda quotes if the user has turned on the setting,
    // even if it is the better quote.
    if (args.routerPreference === RouterPreference.X) {
      return {
        state: QuoteState.SUCCESS,
        trade: uniswapXTrade,
      }
    }
  }

  // Return uniswapXGasUseEstimateUSD as a reference price just for opt-in period
  return { state: QuoteState.SUCCESS, trade: classicTrade, uniswapXGasUseEstimateUSD }
}

function parseToken({ address, chainId, decimals, symbol }: ClassicQuoteData['route'][0][0]['tokenIn']): Token {
  return new Token(chainId, address, parseInt(decimals.toString()), symbol)
}

function parsePool({ fee, sqrtRatioX96, liquidity, tickCurrent, tokenIn, tokenOut }: V3PoolInRoute): Pool {
  return new Pool(
    parseToken(tokenIn),
    parseToken(tokenOut),
    parseInt(fee) as FeeAmount,
    sqrtRatioX96,
    liquidity,
    parseInt(tickCurrent)
  )
}

const parsePair = ({ reserve0, reserve1 }: V2PoolInRoute): Pair =>
  new Pair(
    CurrencyAmount.fromRawAmount(parseToken(reserve0.token), reserve0.quotient),
    CurrencyAmount.fromRawAmount(parseToken(reserve1.token), reserve1.quotient)
  )

// TODO(WEB-2050): Convert other instances of tradeType comparison to use this utility function
export function isExactInput(tradeType: TradeType): boolean {
  return tradeType === TradeType.EXACT_INPUT
}

export function currencyAddressForSwapQuote(currency: Currency): string {
  if (currency.isNative) {
    if (isMatic(currency.chainId)) return SwapRouterNativeAssets.MATIC
    if (isBsc(currency.chainId)) return SwapRouterNativeAssets.BNB
    return SwapRouterNativeAssets.ETH
  }

  return currency.address
}

export function isClassicTrade(trade?: InterfaceTrade): trade is ClassicTrade {
  return trade?.fillType === TradeFillType.Classic
}

export function isUniswapXTrade(trade?: InterfaceTrade): trade is DutchOrderTrade {
  return trade?.fillType === TradeFillType.UniswapX
}

export function shouldUseAPIRouter(args: GetQuoteArgs): boolean {
  const { routerPreference, isRoutingAPIPrice } = args
  if (routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE && isRoutingAPIPrice) {
    return true
  }

  return routerPreference === RouterPreference.API || routerPreference === RouterPreference.X
}

export function getTransactionCount(trade: InterfaceTrade): number {
  let count = 0
  if (trade.approveInfo.needsApprove) {
    count++ // approval step, which can happen in both classic and uniswapx
  }
  if (isUniswapXTrade(trade)) {
    if (trade.wrapInfo.needsWrap) {
      count++ // wrapping step for uniswapx
    }
  } else {
    count++ // classic onchain swap
  }
  return count
}
