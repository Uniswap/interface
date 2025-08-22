/// <reference path="../globals.d.ts" />

/**
 * Maestro E2E Performance Tracking - Flow Start Script
 *
 * Marks the beginning of a test flow and emits a flow_start metric.
 * This script should be called at the beginning of each test flow to track
 * overall flow execution time.
 *
 * @requires Maestro GraalJS environment
 * @requires init-tracking.ts to have been run first
 *
 * Environment Variables:
 * - FLOW_NAME: Name of the flow being started (e.g., 'swap', 'onboarding')
 *
 * Output Variables Set:
 * - CURRENT_FLOW_NAME: Updated with the actual flow name
 * - FLOW_START_TIME: Timestamp when the flow started
 *
 * Metrics Emitted:
 * - flow_start event with flow name, timestamp, platform, and test run ID
 */

import { bufferMetric } from '../utils/bufferMetric'
import { emitMetric } from '../utils/emitMetric'
import { getTimestampString } from '../utils/getTimestamp'
import { createFlowStartMetric } from '../utils/metricCreators'
import { getEnvVar } from '../utils/validateEnv'

// Get flow name from Maestro environment variable
// Falls back to 'unknown' if not provided
const flowName = getEnvVar('FLOW_NAME', 'unknown')

// Update output variables for use by other scripts
output.CURRENT_FLOW_NAME = flowName
output.FLOW_START_TIME = getTimestampString()

// Create flow_start metric
const metric = createFlowStartMetric({
  flowName: output.CURRENT_FLOW_NAME,
  timestamp: parseInt(output.FLOW_START_TIME, 10),
  platform: output.CURRENT_PLATFORM,
  testRunId: output.CURRENT_TEST_RUN_ID,
})

// Emit flow_start metric for local processing
emitMetric(metric)

// Append metric to buffer for cloud upload
bufferMetric(metric, output)

// Log for debugging
console.log(`Started tracking ${flowName} flow`)
