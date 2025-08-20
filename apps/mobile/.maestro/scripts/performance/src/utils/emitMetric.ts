import type { Metric } from '../types'

/**
 * Emit a metric to the console for local processing
 * Metrics are prefixed with MAESTRO_METRIC: for parsing
 */
export function emitMetric(metric: Metric): void {
  console.log(`MAESTRO_METRIC:${JSON.stringify(metric)}`)
}
