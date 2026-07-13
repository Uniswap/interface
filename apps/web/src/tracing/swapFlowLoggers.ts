import { TradingApi } from '@universe/api'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { PriceSourceTag, SwapRouting, SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { planAnalyticsToSnakeCase } from 'uniswap/src/features/transactions/swap/plan/types'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import {
  type PlanSwapTransactionInfoFields,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import type { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'
import type { ConfirmedTransactionDetails } from '~/state/transactions/types'

type OnChainSwapTransactionType = TransactionType.Swap | TransactionType.Bridge
const TRANSACTION_TYPE_TO_SWAP_ROUTING: Record<OnChainSwapTransactionType, SwapRouting> = {
  [TransactionType.Swap]: 'classic',
  [TransactionType.Bridge]: 'bridge',
}

export function logSwapFinalized({
  id,
  hash,
  batchId,
  chainInId,
  chainOutId,
  analyticsContext,
  status,
  type,
  swapStartTimestamp,
  planAnalytics,
  transactedUSDValue,
  priceSource,
  isSponsored,
  sponsorshipCampaignId,
  rwaAnalytics,
}: {
  id: string
  hash: string | undefined
  batchId?: string
  chainInId: number
  chainOutId: number
  analyticsContext: ITraceContext
  status: ConfirmedTransactionDetails['status']
  type: OnChainSwapTransactionType
  swapStartTimestamp?: number
  priceSource?: PriceSourceTag
  planAnalytics?: PlanSwapTransactionInfoFields
  transactedUSDValue?: number
  isSponsored?: boolean
  sponsorshipCampaignId?: string
  rwaAnalytics?: Pick<
    SwapTradeBaseProperties,
    'market_closed' | 'price_warning' | 'token_in_stocks' | 'token_out_stocks'
  >
}) {
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  const event =
    status === TransactionStatus.Success ? SwapEventName.SwapTransactionCompleted : SwapEventName.SwapTransactionFailed

  sendAnalyticsEvent(event, {
    routing: planAnalytics?.stepRouting ?? TRANSACTION_TYPE_TO_SWAP_ROUTING[type],
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
    id,
    hash,
    batch_id: batchId,
    chain_id: chainInId,
    chain_id_in: chainInId,
    chain_id_out: chainOutId,
    transactionOriginType: TransactionOriginType.Internal,
    swap_start_timestamp: swapStartTimestamp,
    transactedUSDValue,
    price_source: priceSource,
    is_sponsored: isSponsored,
    sponsorship_campaign_id: sponsorshipCampaignId,
    ...rwaAnalytics,
    ...planAnalyticsToSnakeCase(planAnalytics),
    ...analyticsContext,
  })

  // log failed swaps to datadog
  if (status === TransactionStatus.Failed && type === TransactionType.Swap) {
    logger.warn('swapFlowLoggers', 'logSwapFinalized', 'Onchain Swap Failure', {
      hash,
      chainLabel: getChainLabel(chainInId),
    })
  }
}

const ROUTING_TO_SWAP_ROUTING: Partial<Record<TradingApi.Routing, SwapRouting>> = {
  [TradingApi.Routing.CLASSIC]: 'classic',
  [TradingApi.Routing.DUTCH_LIMIT]: 'limit_order',
  [TradingApi.Routing.PRIORITY]: 'priority_order',
  [TradingApi.Routing.DUTCH_V2]: 'uniswap_x_v2',
  [TradingApi.Routing.DUTCH_V3]: 'uniswap_x_v3',
  [TradingApi.Routing.BRIDGE]: 'bridge',
  [TradingApi.Routing.CHAINED]: 'chained',
}

export function logUniswapXSwapFinalized({
  id,
  hash,
  orderHash,
  chainId,
  analyticsContext,
  routing,
  status,
  swapStartTimestamp,
  planAnalytics,
  transactedUSDValue,
  priceSource,
  rwaAnalytics,
}: {
  id: string
  hash?: string
  orderHash: string
  chainId: number
  analyticsContext: ITraceContext
  routing: TradingApi.Routing
  status: TransactionStatus
  swapStartTimestamp?: number
  planAnalytics?: PlanSwapTransactionInfoFields
  transactedUSDValue?: number
  priceSource?: PriceSourceTag
  rwaAnalytics?: Pick<
    SwapTradeBaseProperties,
    'market_closed' | 'price_warning' | 'token_in_stocks' | 'token_out_stocks'
  >
}) {
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  const event =
    status === TransactionStatus.Success ? SwapEventName.SwapTransactionCompleted : SwapEventName.SwapTransactionFailed

  sendAnalyticsEvent(event, {
    routing: ROUTING_TO_SWAP_ROUTING[routing],
    order_hash: orderHash,
    transactionOriginType: TransactionOriginType.Internal,
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
    id,
    hash,
    chain_id: chainId,
    swap_start_timestamp: swapStartTimestamp,
    transactedUSDValue,
    price_source: priceSource,
    ...rwaAnalytics,
    ...planAnalyticsToSnakeCase(planAnalytics),
    ...analyticsContext,
  })
}
