import type { MaestroOutput, Metric } from '../types'

/**
 * Add a metric to the metrics buffer for cloud upload
 * Buffer is stored as a JSON string in the output object
 */
export function bufferMetric(metric: Metric, output: MaestroOutput): void {
  try {
    const buffer: Metric[] = JSON.parse(output.METRICS_BUFFER || '[]')
    buffer.push(metric)
    output.METRICS_BUFFER = JSON.stringify(buffer)
  } catch (error) {
    console.log(`Error appending to metrics buffer: ${error instanceof Error ? error.message : String(error)}`)
  }
}
