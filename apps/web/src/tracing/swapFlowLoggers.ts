import { SignatureType } from 'state/signatures/types'
import type { ConfirmedTransactionDetails } from 'state/transactions/types'
import { UniswapXOrderStatus } from 'types/uniswapx'
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
  hash,
  batchId,
  chainInId,
  chainOutId,
  analyticsContext,
  status,
  type,
}: {
  hash: string
  batchId?: string
  chainInId: number
  chainOutId: number
  analyticsContext: ITraceContext
  status: ConfirmedTransactionDetails['status']
  type: OnChainSwapTransactionType
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
    hash,
    batch_id: batchId,
    chain_id: chainInId,
    chain_id_in: chainInId,
    chain_id_out: chainOutId,
    transactionOriginType: TransactionOriginType.Internal,
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

const SIGNATURE_TYPE_TO_SWAP_ROUTING: Record<SignatureType, SwapRouting> = {
  [SignatureType.SIGN_LIMIT]: 'limit_order',
  [SignatureType.SIGN_PRIORITY_ORDER]: 'priority_order',
  [SignatureType.SIGN_UNISWAPX_V2_ORDER]: 'uniswap_x_v2',
  [SignatureType.SIGN_UNISWAPX_V3_ORDER]: 'uniswap_x_v3',
  [SignatureType.SIGN_UNISWAPX_ORDER]: 'uniswap_x',
}

export function logUniswapXSwapFinalized({
  hash,
  orderHash,
  chainId,
  analyticsContext,
  signatureType,
  status,
}: {
  hash?: string
  orderHash: string
  chainId: number
  analyticsContext: ITraceContext
  signatureType: SignatureType
  status: UniswapXOrderStatus.FILLED | UniswapXOrderStatus.CANCELLED | UniswapXOrderStatus.EXPIRED
}) {
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  const event =
    status === UniswapXOrderStatus.FILLED ? SwapEventName.SwapTransactionCompleted : SwapEventName.SwapTransactionFailed

  sendAnalyticsEvent(event, {
    routing: SIGNATURE_TYPE_TO_SWAP_ROUTING[signatureType],
    order_hash: orderHash,
    transactionOriginType: TransactionOriginType.Internal,
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
    hash,
    chain_id: chainId,
    ...analyticsContext,
  })
}
