import { SwapEventName } from '@uniswap/analytics-events'
import { SignatureType } from 'state/signatures/types'
import { ConfirmedTransactionDetails, TransactionType } from 'state/transactions/types'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapRouting } from 'uniswap/src/features/telemetry/types'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

type OnChainSwapTransactionType = TransactionType.SWAP | TransactionType.BRIDGE
const TRANSACTION_TYPE_TO_SWAP_ROUTING: Record<OnChainSwapTransactionType, SwapRouting> = {
  [TransactionType.SWAP]: 'classic',
  [TransactionType.BRIDGE]: 'bridge',
}

export function logSwapFinalized(
  hash: string,
  chainInId: number,
  chainOutId: number,
  analyticsContext: ITraceContext,
  status: ConfirmedTransactionDetails['status'],
  type: OnChainSwapTransactionType,
) {
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  const event =
    status === TransactionStatus.Confirmed
      ? SwapEventName.SWAP_TRANSACTION_COMPLETED
      : SwapEventName.SWAP_TRANSACTION_FAILED

  sendAnalyticsEvent(event, {
    routing: TRANSACTION_TYPE_TO_SWAP_ROUTING[type],
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
    hash,
    chain_id: chainInId,
    chain_id_in: chainInId,
    chain_id_out: chainOutId,
    transactionOriginType: TransactionOriginType.Internal,
    ...analyticsContext,
  })
}

const SIGNATURE_TYPE_TO_SWAP_ROUTING: Record<SignatureType, SwapRouting> = {
  [SignatureType.SIGN_LIMIT]: 'limit_order',
  [SignatureType.SIGN_PRIORITY_ORDER]: 'priority_order',
  [SignatureType.SIGN_UNISWAPX_V2_ORDER]: 'uniswap_x_v2',
  [SignatureType.SIGN_UNISWAPX_V3_ORDER]: 'uniswap_x_v3',
  [SignatureType.SIGN_UNISWAPX_ORDER]: 'uniswap_x',
}

export function logUniswapXSwapFinalized(
  hash: string | undefined,
  orderHash: string,
  chainId: number,
  analyticsContext: ITraceContext,
  signatureType: SignatureType,
  status: UniswapXOrderStatus.FILLED | UniswapXOrderStatus.CANCELLED | UniswapXOrderStatus.EXPIRED,
) {
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  const event =
    status === UniswapXOrderStatus.FILLED
      ? SwapEventName.SWAP_TRANSACTION_COMPLETED
      : SwapEventName.SWAP_TRANSACTION_FAILED

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
