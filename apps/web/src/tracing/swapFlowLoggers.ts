import { TradingApi } from '@universe/api'
import type { ConfirmedTransactionDetails } from 'state/transactions/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { SwapRouting } from 'uniswap/src/features/telemetry/types'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import type { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

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
  isFinalStep,
  swapStartTimestamp,
}: {
  id: string
  hash: string | undefined
  batchId?: string
  chainInId: number
  chainOutId: number
  analyticsContext: ITraceContext
  status: ConfirmedTransactionDetails['status']
  type: OnChainSwapTransactionType
  isFinalStep?: boolean
  swapStartTimestamp?: number
}) {
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  const event =
    status === TransactionStatus.Success ? SwapEventName.SwapTransactionCompleted : SwapEventName.SwapTransactionFailed

  sendAnalyticsEvent(event, {
    routing: TRANSACTION_TYPE_TO_SWAP_ROUTING[type],
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
    is_final_step: isFinalStep ?? true, // If no `isFinalStep` is provided, we assume it's not a multi-step transaction and default to `true`
    swap_start_timestamp: swapStartTimestamp,
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
}

export function logUniswapXSwapFinalized({
  id,
  hash,
  orderHash,
  chainId,
  analyticsContext,
  routing,
  status,
  isFinalStep,
  swapStartTimestamp,
}: {
  id: string
  hash?: string
  orderHash: string
  chainId: number
  analyticsContext: ITraceContext
  routing: TradingApi.Routing
  status: TransactionStatus
  isFinalStep?: boolean
  swapStartTimestamp?: number
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
    is_final_step: isFinalStep ?? true, // If no `isFinalStep` is provided, we assume it's not a multi-step transaction and default to `true`
    swap_start_timestamp: swapStartTimestamp,
    ...analyticsContext,
  })
}
