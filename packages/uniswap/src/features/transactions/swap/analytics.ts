/* eslint-disable max-lines */
import { Protocol } from '@uniswap/router-sdk'
import type { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { TradingApi } from '@universe/api'
import { useEffect } from 'react'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { SwapRouting, SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { getTokenProtectionWarning } from 'uniswap/src/features/tokens/safetyUtils'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { ClassicTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getSwapFeeUsd } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isChained, isClassic, isJupiter, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import { getProtocolVersionFromTrade } from 'uniswap/src/features/transactions/swap/utils/trade'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getCurrencyAddressForAnalytics } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import type { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

// Use TradingApi namespace for enums

type ProtocolVersion = 'V2' | 'V3' | 'V4' | 'unknown'

export interface RouteInfo {
  poolAddress: string
  version: ProtocolVersion
}

export interface SwapRoutesAnalyticsData {
  poolsCount?: number
  // The complete route in order of execution
  paths?: RouteInfo[][]
  // Flags for which versions are used
  v2Used: boolean
  v3Used: boolean
  v4Used: boolean
  uniswapXUsed: boolean
  jupiterUsed: boolean
}

const DEFAULT_RESULT = {
  v2Used: false,
  v3Used: false,
  v4Used: false,
  uniswapXUsed: false,
  jupiterUsed: false,
}

function getPoolAddress(pool: Pair | V3Pool | V4Pool): Address | undefined {
  if (pool instanceof Pair) {
    return Pair.getAddress(pool.token0, pool.token1)
  } else if (pool instanceof V3Pool) {
    return V3Pool.getAddress(pool.token0, pool.token1, pool.fee)
  } else if (pool instanceof V4Pool) {
    return pool.poolId
  }
  return undefined
}

function getClassicPoolProtocol(pool: Pair | V3Pool | V4Pool): ProtocolVersion | undefined {
  if (pool instanceof Pair) {
    return 'V2'
  } else if (pool instanceof V3Pool) {
    return 'V3'
  } else if (pool instanceof V4Pool) {
    return 'V4'
  }
  return undefined
}

/**
 * Loops through all routes and returns an array of pools combinations.
 */
function getRoutings(routes: ClassicTrade['routes']): Array<Array<Pair | V3Pool | V4Pool>> {
  return routes.map((route) => route.pools)
}

/**
 * Extracts the block number for analytics, if applicable to the trade type.
 * Currently only classic quotes expose block number.
 */
function getAnalyticsBlockNumber(trade: Trade): string | undefined {
  if (isClassic(trade)) {
    return trade.quote.quote.blockNumber
  }
  return undefined
}

/**
 * Extracts the estimated network fee in USD for analytics. Currently only implemented for classic quotes.
 */
function getAnalyticsNetworkFeeUSD(trade: Trade): string | undefined {
  if (isClassic(trade)) {
    return trade.quote.quote.gasFeeUSD
  }
  return undefined
}

/**
 * Extracts simulation failure reasons for analytics. Currently only implemented for classic quotes.
 */
function getAnalyticsSimulationFailures(trade: Trade): TradingApi.TransactionFailureReason[] | undefined {
  if (isClassic(trade)) {
    return trade.quote.quote.txFailureReasons
  }
  return undefined
}

/**
 * Extract route data from a trade for analytics purposes.
 * Handles Classic (with detailed pool information), UniswapX, and Jupiter routing.
 * @param trade The trade object containing route information
 * @returns Structured route data for analytics or undefined if route data is not available
 */
export function getRouteAnalyticsData({
  routing,
  routes,
}: {
  routing?: TradingApi.Routing
  routes?: ClassicTrade['routes']
}): SwapRoutesAnalyticsData | undefined {
  if (!routing) {
    return undefined
  }

  // For classic trades, we can extract detailed route information
  if (isClassic({ routing }) && routes) {
    const routings = getRoutings(routes)
    const paths = routings.map((route) =>
      route.map((pool) => ({
        poolAddress: getPoolAddress(pool) ?? 'unknown',
        version: getClassicPoolProtocol(pool) ?? 'unknown',
      })),
    )
    // Determine which versions are used
    const v2Used = paths.some((path) => path.some((pool) => pool.version === Protocol.V2))
    const v3Used = paths.some((path) => path.some((pool) => pool.version === Protocol.V3))
    const v4Used = paths.some((path) => path.some((pool) => pool.version === Protocol.V4))
    const poolsCount = paths.reduce((acc, path) => acc + path.length, 0)

    return {
      poolsCount,
      paths,
      v2Used,
      v3Used,
      v4Used,
      uniswapXUsed: false,
      jupiterUsed: false,
    }
  }

  if (isUniswapX({ routing })) {
    // For UniswapX trades, we don't have detailed route information in the same way
    // But we can mark it as using X
    return {
      ...DEFAULT_RESULT,
      uniswapXUsed: true,
    }
  }

  if (isJupiter({ routing })) {
    // For Jupiter trades, route through various Solana DEXs but don't expose
    // detailed pool information in the same format as Classic
    return {
      ...DEFAULT_RESULT,
      jupiterUsed: true,
    }
  }

  // For other trade types or if extraction fails
  return DEFAULT_RESULT
}

export function getPriceImpact(trade: Trade | null | undefined): string | undefined {
  if (!trade || isUniswapX(trade) || isChained(trade)) {
    return undefined
  }
  return trade.priceImpact?.multiply(100).toSignificant()
}

function getFeeUsd({
  trade,
  currencyInAmountUSD,
  currencyOutAmountUSD,
}: {
  trade: Trade<Currency, Currency, TradeType>
  currencyInAmountUSD?: Maybe<CurrencyAmount<Currency>>
  currencyOutAmountUSD?: Maybe<CurrencyAmount<Currency>>
}): number | undefined {
  const swapFee = trade.swapFee

  if (!swapFee) {
    return undefined
  }

  const amountUsd = swapFee.feeField === CurrencyField.INPUT ? currencyInAmountUSD : currencyOutAmountUSD

  if (!amountUsd) {
    return undefined
  }

  const amount = swapFee.feeField === CurrencyField.INPUT ? trade.inputAmount : trade.outputAmount

  return getSwapFeeUsd({ swapFee, amount, amountUsd })
}

function getQuoteRequestIdFields(trade: Trade): {
  requestId: string
  quoteId: string | undefined
  ura_request_id: string | undefined
} {
  const requestId = trade.quote.requestId
  let uraRequestId: string | undefined
  let quoteId: string | undefined

  // quote id -> points to routing api whereas request id -> points to trading api
  if (isClassic(trade)) {
    quoteId = trade.quote.quote.quoteId
  }

  // Backwards compatibility with old ura_request_id field
  if (isClassic(trade) || isUniswapX(trade)) {
    uraRequestId = requestId
  }

  return { requestId, ura_request_id: uraRequestId, quoteId }
}

function getAnalyticsProtocolType(trade: Trade): string | undefined {
  if (isJupiter(trade)) {
    return trade.quote.quote.router.raw
  }

  return getProtocolVersionFromTrade(trade)
}

// hook-based analytics because this one is data-lifecycle dependent
export function useSwapAnalytics(derivedSwapInfo: DerivedSwapInfo): void {
  const formatter = useLocalizationContext()
  const trace = useTrace()
  const {
    trade: { trade },
  } = derivedSwapInfo

  const quoteId = trade?.quote.requestId

  const wallet = useWallet()
  const evmAddress = wallet.evmAccount?.address
  const svmAddress = wallet.svmAccount?.address

  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress,
    svmAddress,
    fetchPolicy: 'cache-first',
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want to re-run this when we get a new `quoteId`
  useEffect(() => {
    if (!trade) {
      return
    }

    sendAnalyticsEvent(
      SwapEventName.SwapQuoteReceived,
      getBaseTradeAnalyticsProperties({
        formatter,
        trade,
        currencyInAmountUSD: derivedSwapInfo.currencyAmountsUSDValue.input,
        currencyOutAmountUSD: derivedSwapInfo.currencyAmountsUSDValue.output,
        portfolioBalanceUsd: portfolioData?.balanceUSD,
        trace,
      }),
    )

    // TODO(SWAP-641): Add blockingError for evm
    if (trade.blockingError) {
      sendAnalyticsEvent(SwapEventName.SwapBlocked, {
        ...getBaseTradeAnalyticsProperties({
          formatter,
          trade,
          currencyInAmountUSD: derivedSwapInfo.currencyAmountsUSDValue.input,
          currencyOutAmountUSD: derivedSwapInfo.currencyAmountsUSDValue.output,
          portfolioBalanceUsd: portfolioData?.balanceUSD,
          trace,
        }),
        category: trade.blockingError.category,
        error_code: trade.blockingError.code,
        error_message: trade.blockingError.message,
      })
    }
  }, [quoteId])
}

// Typing is improved by using the actual return type instead of narrowing to `SwapTradeBaseProperties`
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getBaseTradeAnalyticsProperties({
  formatter,
  trade,
  currencyInAmountUSD,
  currencyOutAmountUSD,
  portfolioBalanceUsd,
  presetPercentage,
  preselectAsset,
  trace,
  isBatched,
  includedPermitTransactionStep,
  includesDelegation,
  isSmartWalletTransaction,
}: {
  formatter: LocalizationContextState
  trade: Trade<Currency, Currency, TradeType>
  currencyInAmountUSD?: Maybe<CurrencyAmount<Currency>>
  currencyOutAmountUSD?: Maybe<CurrencyAmount<Currency>>
  portfolioBalanceUsd?: number
  presetPercentage?: PresetPercentage
  preselectAsset?: boolean
  trace: ITraceContext
  isBatched?: boolean
  includedPermitTransactionStep?: boolean
  includesDelegation?: boolean
  isSmartWalletTransaction?: boolean
}) {
  const portionAmount = trade.swapFee?.amount

  const feeCurrencyAmount = getCurrencyAmount({
    value: portionAmount,
    valueType: ValueType.Raw,
    currency: trade.outputAmount.currency,
  })

  const finalOutputAmount = feeCurrencyAmount ? trade.outputAmount.subtract(feeCurrencyAmount) : trade.outputAmount

  return {
    ...trace,
    routing: tradeRoutingToFillType(trade),
    protocol: getAnalyticsProtocolType(trade),
    total_balances_usd: portfolioBalanceUsd,
    token_in_symbol: trade.inputAmount.currency.symbol,
    token_out_symbol: trade.outputAmount.currency.symbol,
    token_in_address: getCurrencyAddressForAnalytics(trade.inputAmount.currency),
    token_out_address: getCurrencyAddressForAnalytics(trade.outputAmount.currency),
    price_impact_basis_points: getPriceImpact(trade),
    chain_id:
      trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
        ? trade.inputAmount.currency.chainId
        : undefined,
    chain_id_in: trade.inputAmount.currency.chainId,
    chain_id_out: trade.outputAmount.currency.chainId,
    token_in_amount: trade.inputAmount.toExact(),
    token_out_amount: formatter.formatCurrencyAmount({
      value: finalOutputAmount,
      type: NumberType.SwapTradeAmount,
    }),
    token_in_amount_usd: currencyInAmountUSD ? parseFloat(currencyInAmountUSD.toFixed(2)) : undefined,
    token_out_amount_usd: currencyOutAmountUSD ? parseFloat(currencyOutAmountUSD.toFixed(2)) : undefined,
    preset_percentage: presetPercentage,
    preselect_asset: preselectAsset,
    allowed_slippage:
      trade.slippageTolerance !== undefined ? parseFloat(trade.slippageTolerance.toFixed(2)) : undefined,
    allowed_slippage_basis_points: trade.slippageTolerance ? trade.slippageTolerance * 100 : undefined,
    fee_amount: portionAmount,
    ...getQuoteRequestIdFields(trade),
    ura_block_number: getAnalyticsBlockNumber(trade),
    swap_quote_block_number: getAnalyticsBlockNumber(trade),
    transactionOriginType: TransactionOriginType.Internal,
    estimated_network_fee_usd: getAnalyticsNetworkFeeUSD(trade),
    fee_usd: getFeeUsd({ trade, currencyInAmountUSD, currencyOutAmountUSD }),
    type: trade.tradeType,
    minimum_output_after_slippage: trade.minAmountOut.toSignificant(6),
    token_in_amount_max: trade.maxAmountIn.toExact(),
    token_out_amount_min: trade.minAmountOut.toExact(),
    token_in_detected_tax: parseFloat(trade.inputTax.toFixed(2)),
    token_out_detected_tax: parseFloat(trade.outputTax.toFixed(2)),
    simulation_failure_reasons: getAnalyticsSimulationFailures(trade),
    ...getRouteAnalyticsData(trade),
    is_batch: isBatched,
    included_permit_transaction_step: includedPermitTransactionStep,
    includes_delegation: includesDelegation,
    is_smart_wallet_transaction: isSmartWalletTransaction,
  } as const
}

export type ExtractedBaseTradeAnalyticsProperties = ReturnType<typeof getBaseTradeAnalyticsProperties>

export function getBaseTradeAnalyticsPropertiesFromSwapInfo({
  transactionSettings,
  derivedSwapInfo,
  trace,
}: {
  transactionSettings: TransactionSettings
  derivedSwapInfo: DerivedSwapInfo
  trace: ITraceContext
}): SwapTradeBaseProperties {
  const { chainId, currencyAmounts, currencyAmountsUSDValue } = derivedSwapInfo
  const inputCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
  const outputCurrencyAmount = currencyAmounts[CurrencyField.OUTPUT]

  const currencyInAmountUSD = currencyAmountsUSDValue[CurrencyField.INPUT]
    ? parseFloat(currencyAmountsUSDValue[CurrencyField.INPUT].toFixed(2))
    : undefined
  const currencyOutAmountUSD = currencyAmountsUSDValue[CurrencyField.OUTPUT]
    ? parseFloat(currencyAmountsUSDValue[CurrencyField.OUTPUT].toFixed(2))
    : undefined

  const slippageTolerance = transactionSettings.customSlippageTolerance ?? transactionSettings.autoSlippageTolerance

  const portionAmount = getClassicQuoteFromResponse(derivedSwapInfo.trade.trade?.quote)?.portionAmount

  const feeCurrencyAmount = getCurrencyAmount({
    value: portionAmount,
    valueType: ValueType.Raw,
    currency: outputCurrencyAmount?.currency,
  })

  const finalOutputAmount =
    outputCurrencyAmount && feeCurrencyAmount ? outputCurrencyAmount.subtract(feeCurrencyAmount) : outputCurrencyAmount

  const trade = derivedSwapInfo.trade.trade

  return {
    ...trace,
    token_in_symbol: inputCurrencyAmount?.currency.symbol,
    token_out_symbol: outputCurrencyAmount?.currency.symbol,
    token_in_address: inputCurrencyAmount ? getCurrencyAddressForAnalytics(inputCurrencyAmount.currency) : '',
    token_out_address: outputCurrencyAmount ? getCurrencyAddressForAnalytics(outputCurrencyAmount.currency) : '',
    price_impact_basis_points: getPriceImpact(trade),
    estimated_network_fee_usd: undefined,
    chain_id: chainId,
    token_in_amount: inputCurrencyAmount?.toExact() ?? '',
    token_out_amount: finalOutputAmount?.toExact() ?? '',
    token_in_amount_usd: currencyInAmountUSD,
    token_out_amount_usd: currencyOutAmountUSD,
    allowed_slippage_basis_points: slippageTolerance ? slippageTolerance * 100 : undefined,
    fee_amount: portionAmount,
    transactionOriginType: TransactionOriginType.Internal,
    tokenWarnings: {
      input: getTokenProtectionWarning(derivedSwapInfo.currencies.input),
      output: getTokenProtectionWarning(derivedSwapInfo.currencies.output),
    },
  }
}

export function logSwapQuoteFetch({
  chainId,
  isUSDQuote = false,
  isQuickRoute = false,
}: {
  chainId: number
  isUSDQuote?: boolean
  isQuickRoute?: boolean
}): void {
  let performanceMetrics = {}
  if (!isUSDQuote) {
    const hasSetSwapQuote = timestampTracker.hasTimestamp(SwapEventType.FirstQuoteFetchStarted)
    const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstQuoteFetchStarted)

    // We only log the time_to_first_quote_request metric for the first quote request of a session.
    const time_to_first_quote_request = hasSetSwapQuote ? undefined : elapsedTime
    const time_to_first_quote_request_since_first_input = hasSetSwapQuote
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstQuoteFetchStarted, SwapEventType.FirstSwapAction)

    performanceMetrics = { time_to_first_quote_request, time_to_first_quote_request_since_first_input }
  }
  sendAnalyticsEvent(SwapEventName.SwapQuoteFetch, { chainId, isQuickRoute, ...performanceMetrics })
  logger.info('analytics', 'logSwapQuoteFetch', SwapEventName.SwapQuoteFetch, {
    chainId,
    // we explicitly log it here to show on Datadog dashboard
    chainLabel: getChainLabel(chainId),
    isQuickRoute,
    ...performanceMetrics,
  })
}

export function tradeRoutingToFillType({
  routing,
  indicative,
}: {
  routing: TradingApi.Routing
  indicative: boolean
}): SwapRouting {
  if (indicative) {
    return 'none'
  }

  switch (routing) {
    case TradingApi.Routing.DUTCH_V3:
      return 'uniswap_x_v3'
    case TradingApi.Routing.DUTCH_V2:
      return 'uniswap_x_v2'
    case TradingApi.Routing.DUTCH_LIMIT:
      return 'uniswap_x'
    case TradingApi.Routing.PRIORITY:
      return 'priority_order'
    case TradingApi.Routing.LIMIT_ORDER:
      return 'limit_order'
    case TradingApi.Routing.CLASSIC:
      return 'classic'
    case TradingApi.Routing.BRIDGE:
      return 'bridge'
    case TradingApi.Routing.JUPITER:
      return 'jupiter'
    default:
      return 'none'
  }
}
