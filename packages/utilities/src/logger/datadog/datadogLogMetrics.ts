import { logger } from 'utilities/src/logger/logger'

/**
 * Datadog Log Metrics used to create custom metrics in Datadog
 */
export const DatadogLogMetrics = {
  UniswapXSwapSubmitted: 'uniswapx_swap_submitted',
  UniswapXSwapFailed: 'uniswapx_swap_failed',
  SwapSubmitted: 'swap_submitted',
  PriceQuoteFetch: 'price_quote_fetch',
} as const

type CommonLogMetricData = {
  tokenInChainId: number
  tokenOutChainId?: number
  tokenInSymbol: Maybe<string>
  tokenInAddress: Maybe<string>
  tokenOutSymbol: Maybe<string>
  tokenOutAddress: Maybe<string>
} & Record<string, unknown>

/**
 * Type mapping for metric-specific data structures
 */
export interface DatadogLogMetricData {
  [DatadogLogMetrics.UniswapXSwapFailed]: CommonLogMetricData & {
    orderHash: string
  }
  [DatadogLogMetrics.UniswapXSwapSubmitted]: CommonLogMetricData & {
    orderHash: string
  }
  [DatadogLogMetrics.SwapSubmitted]: CommonLogMetricData & {
    txHash: string
  }
  [DatadogLogMetrics.PriceQuoteFetch]: {
    chainId: number
    isUSDQuote: boolean
    quoteSource?: string
    pollInterval?: number
  }
}

type DatadogLogMetric = (typeof DatadogLogMetrics)[keyof typeof DatadogLogMetrics]

/**
 * Used for logging metrics to Datadog that can be used for monitoring/alerting.
 * @param params
 */
export function logAsMetric<T extends DatadogLogMetric>(params: {
  fileName: string
  functionName: string
  metric: T
  data: DatadogLogMetricData[T]
  /** Note: 'error' is not supported for metrics as they are submitted as an error but not a log in our DD configuration */
  level?: 'info' | 'warn'
}): void {
  const { fileName, functionName, metric, data, level } = params
  switch (level) {
    case 'warn':
      logger.warn(fileName, functionName, metric, data)
      break
    case 'info':
    default:
      logger.info(fileName, functionName, metric, data)
      break
  }
}
