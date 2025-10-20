import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { SwapTradeBaseProperties, UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { TransactionDetails, TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger as loggerUtil } from 'utilities/src/logger/logger'
import type { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'

type Logger = typeof loggerUtil

/**
 * Create an analytics service implementation
 */
export function createAnalyticsService(ctx: {
  sendAnalyticsEvent: typeof sendAnalyticsEvent
  logger: Logger
}): AnalyticsService {
  function trackTransactionEvent<T extends WalletEventName>(
    eventName: T,
    properties: UniverseEventProperties[T],
  ): void {
    try {
      ctx.sendAnalyticsEvent(eventName, properties)
    } catch (error) {
      ctx.logger.error(error instanceof Error ? error : new Error(String(error)), {
        tags: { file: 'AnalyticsService', function: 'trackTransactionEvent' },
        extra: { eventName },
      })
    }
  }
  return {
    trackTransactionEvent,

    trackSwapSubmitted(transaction: TransactionDetails, analytics?: SwapTradeBaseProperties): void {
      if (!analytics) {
        if (transaction.transactionOriginType === TransactionOriginType.Internal) {
          ctx.logger.error(new Error('Missing `analytics` for swap'), {
            tags: { file: 'AnalyticsService', function: 'trackSwapSubmitted' },
            extra: { transaction },
          })
        }
        return
      }

      const event: UniverseEventProperties[WalletEventName.SwapSubmitted] = {
        transaction_hash: transaction.hash ?? '',
        ...analytics,
      }

      trackTransactionEvent(WalletEventName.SwapSubmitted, event)
    },
  }
}
