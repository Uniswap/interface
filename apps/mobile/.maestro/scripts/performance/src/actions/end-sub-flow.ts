/// <reference path="../globals.d.ts" />

/**
 * Maestro E2E Performance Tracking - Sub-Flow End Script
 *
 * Marks the completion of a sub-flow and restores the parent flow context.
 * This script calculates the sub-flow duration and emits metrics while
 * ensuring the parent flow tracking continues correctly.
 *
 * @requires Maestro GraalJS environment
 * @requires start-sub-flow.ts to have been run first
 *
 * Environment Variables:
 * - SUB_FLOW_NAME: Name of the sub-flow being ended
 *
 * Output Variables Used:
 * - PARENT_FLOW_NAME: Name of the parent flow to restore
 * - SUB_FLOW_START_TIME: Start timestamp for duration calculation
 * - CURRENT_PLATFORM: Platform being tested
 * - CURRENT_TEST_RUN_ID: Unique test run identifier
 *
 * Output Variables Cleaned:
 * - PARENT_FLOW_NAME: Deleted after restoring context
 * - SUB_FLOW_START_TIME: Deleted after calculating duration
 *
 * Metrics Emitted:
 * - sub_flow_end event with parent flow, sub-flow name, duration, and context
 */

import { bufferMetric } from '../utils/bufferMetric'
import { emitMetric } from '../utils/emitMetric'
import { getTimestamp } from '../utils/getTimestamp'
import { createSubFlowEndMetric } from '../utils/metricCreators'
import { getEnvVar } from '../utils/validateEnv'

// Get sub-flow name with safe fallback
const subFlowName = getEnvVar('SUB_FLOW_NAME', 'unknown-sub-flow')

// Get parent flow name, with fallback to current flow if not set
const parentFlowName = output.PARENT_FLOW_NAME || output.CURRENT_FLOW_NAME || 'unknown'

// Calculate sub-flow duration
const startTime = parseInt(output.SUB_FLOW_START_TIME || '0', 10)
const duration = getTimestamp() - startTime

// Create sub_flow_end metric
const metric = createSubFlowEndMetric({
  parentFlowName,
  subFlowName,
  timestamp: getTimestamp(),
  duration,
  status: 'success',
  platform: output.CURRENT_PLATFORM,
  testRunId: output.CURRENT_TEST_RUN_ID,
})

// Emit sub_flow_end metric for local processing
emitMetric(metric)

// Append metric to buffer for cloud upload
bufferMetric(metric, output)

// Restore parent flow context for continued tracking
if (output.PARENT_FLOW_NAME) {
  output.CURRENT_FLOW_NAME = output.PARENT_FLOW_NAME
  delete output.PARENT_FLOW_NAME
}

// Clean up sub-flow specific tracking variables
delete output.SUB_FLOW_START_TIME

// Log completion for debugging
console.log(`${subFlowName} sub-flow completed in ${duration}ms`)
