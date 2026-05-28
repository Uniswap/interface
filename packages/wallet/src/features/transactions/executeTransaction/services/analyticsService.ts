import type { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import type { SwapTradeBaseProperties, UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import type { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Service for tracking analytics events
 * Abstracts analytics reporting
 */
export interface AnalyticsService {
  /**
   * Track a transaction-related event
   * @param eventName The name of the event
   * @param properties The event properties
   */
  trackTransactionEvent<T extends WalletEventName>(eventName: T, properties: UniverseEventProperties[T]): void

  /**
   * Track a swap-specific event
   * @param transaction The transaction details
   * @param analytics Analytics properties for the swap
   */
  trackSwapSubmitted(transaction: TransactionDetails, analytics?: SwapTradeBaseProperties): void
}
