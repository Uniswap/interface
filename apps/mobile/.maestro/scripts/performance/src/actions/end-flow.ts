/// <reference path="../globals.d.ts" />

/**
 * Maestro E2E Performance Tracking - Flow End Script
 *
 * Marks the completion of a test flow and emits a flow_end metric.
 * This script should be called at the end of each test flow to calculate
 * and report the total flow execution time.
 *
 * @requires Maestro GraalJS environment
 * @requires start-flow.ts to have been run first
 *
 * Output Variables Used:
 * - CURRENT_FLOW_NAME: Name of the current flow
 * - FLOW_START_TIME: Timestamp when the flow started
 * - CURRENT_PLATFORM: Platform being tested
 * - CURRENT_TEST_RUN_ID: Unique test run identifier
 *
 * Metrics Emitted:
 * - flow_end event with flow name, duration, status, and context
 *
 * Note: This script always reports status as 'success'. Failed flows that
 * terminate early will have synthetic flow_end events added during metric extraction.
 */

import { bufferMetric } from '../utils/bufferMetric'
import { emitMetric } from '../utils/emitMetric'
import { getTimestamp } from '../utils/getTimestamp'
import { createFlowEndMetric } from '../utils/metricCreators'

// Retrieve flow information from output variables
const flowName = output.CURRENT_FLOW_NAME || 'unknown'
const startTime = parseInt(output.FLOW_START_TIME || '0', 10)

// Calculate total flow duration
const duration = getTimestamp() - startTime

// Create flow_end metric
const metric = createFlowEndMetric({
  flowName,
  timestamp: getTimestamp(),
  duration,
  status: 'success', // Failed flows handled by extraction script
  platform: output.CURRENT_PLATFORM,
  testRunId: output.CURRENT_TEST_RUN_ID,
})

// Emit flow_end metric for local processing
emitMetric(metric)

// Append metric to buffer for cloud upload
bufferMetric(metric, output)

// Log completion for debugging
console.log(`${flowName} flow completed in ${duration}ms`)
