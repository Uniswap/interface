#!/usr/bin/env node
/**
 * Process Maestro test metrics from NDJSON format.
 * Adds synthetic flow_end events for flows that failed to complete.
 */

import * as fs from 'fs'
import * as readline from 'readline'
import type { Metric } from '../types'

type FlowStartMetric = Metric & {
  event: 'flow_start'
  flowName: string
  timestamp: number
  platform: string
  testRunId: string
}

type FlowEndMetric = Metric & {
  event: 'flow_end'
  flowName: string
  timestamp: number
  duration: number
  status: 'success' | 'failure'
  platform: string
  testRunId: string
  synthetic?: boolean
}

/**
 * Ensures a value is a number, converting strings if necessary
 */
function ensureNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

/**
 * Process metrics from input file and write to output file
 */
async function processMetrics(inputFile: string, outputFile: string): Promise<void> {
  // Data structures for tracking flow states
  const flowStarts = new Map<string, FlowStartMetric>()
  const flowEnds = new Set<string>()
  const metrics: Metric[] = []

  // Create read stream with error handling
  const input = fs.createReadStream(inputFile)
  let output: fs.WriteStream | null = null

  try {
    // Set up error handlers for input stream
    input.on('error', (error) => {
      throw new Error(`Failed to read input file: ${error.message}`)
    })

    // Create readline interface
    const rl = readline.createInterface({ input })

    // First pass: Read all metrics and identify incomplete flows
    for await (const line of rl) {
      if (!line.trim()) {
        continue
      }

      try {
        const metric = JSON.parse(line) as Metric
        metrics.push(metric)

        // Track flow lifecycle events (ActionMetric has 'type' instead of 'event')
        if ('event' in metric && metric.event === 'flow_start') {
          const flowStart = metric as FlowStartMetric
          flowStart.timestamp = ensureNumber(flowStart.timestamp)
          flowStarts.set(flowStart.testRunId, flowStart)
        } else if ('event' in metric && metric.event === 'flow_end') {
          const flowEnd = metric as FlowEndMetric
          flowEnds.add(flowEnd.testRunId)
        }
      } catch (_e) {
        console.error('Failed to parse metric line:', line)
        // Continue processing other lines even if one fails
      }
    }

    // Create output stream with error handling
    output = fs.createWriteStream(outputFile)

    // Set up error handler for output stream
    output.on('error', (error) => {
      throw new Error(`Failed to write output file: ${error.message}`)
    })

    // Write all original metrics to output
    for (const metric of metrics) {
      await new Promise<void>((resolve, reject) => {
        const line = JSON.stringify(metric) + '\n'
        if (!output) {
          throw new Error('Output stream not initialized')
        }
        output.write(line, (error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })
    }

    // Second pass: Add synthetic flow_end events for incomplete flows
    let addedCount = 0
    for (const [testRunId, startMetric] of Array.from(flowStarts.entries())) {
      if (!flowEnds.has(testRunId)) {
        // Find the last recorded timestamp for this flow
        let lastTimestamp = startMetric.timestamp

        const flowMetrics = metrics.filter((m) => m.testRunId === testRunId)
        for (const m of flowMetrics) {
          const timestamp = ensureNumber((m as unknown as Record<string, unknown>).timestamp, 0)
          if (timestamp > lastTimestamp) {
            lastTimestamp = timestamp
          }
        }

        // Ensure we have valid timestamps for duration calculation
        const startTime = ensureNumber(startMetric.timestamp)
        const endTime = ensureNumber(lastTimestamp, startTime)
        const duration = endTime - startTime

        // Create synthetic flow_end event
        const endMetric: FlowEndMetric = {
          event: 'flow_end',
          flowName: startMetric.flowName,
          timestamp: endTime,
          duration,
          status: 'failure', // Mark as failed since it didn't complete naturally
          platform: startMetric.platform,
          testRunId,
          synthetic: true, // Flag to indicate this was artificially generated
        }

        // Write synthetic metric
        await new Promise<void>((resolve, reject) => {
          const line = JSON.stringify(endMetric) + '\n'
          if (!output) {
            throw new Error('Output stream not initialized')
          }
          output.write(line, (error) => {
            if (error) {
              reject(error)
            } else {
              resolve()
            }
          })
        })

        addedCount++
      }
    }

    // Report synthetic events added
    if (addedCount > 0) {
      console.log(`Added ${addedCount} synthetic flow_end events for failed flows`)
    }
  } finally {
    // Ensure output stream is properly closed
    if (output) {
      await new Promise<void>((resolve) => {
        if (!output) {
          throw new Error('Output stream not initialized')
        }
        output.end(() => resolve())
      })
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const [, , inputFile, outputFile] = process.argv

  // Validate command line arguments
  if (!inputFile || !outputFile) {
    console.error('Usage: ts-node process-metrics.ts <input-file> <output-file>')
    process.exit(1)
  }

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`)
    process.exit(1)
  }

  try {
    await processMetrics(inputFile, outputFile)
    console.log(`Successfully processed metrics from ${inputFile} to ${outputFile}`)
  } catch (error) {
    console.error('Error processing metrics:', error)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}

export { ensureNumber, processMetrics }
