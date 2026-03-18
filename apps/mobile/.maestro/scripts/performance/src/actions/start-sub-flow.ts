/// <reference path="../globals.d.ts" />

/**
 * Maestro E2E Performance Tracking - Sub-Flow Start Script
 *
 * Marks the beginning of a sub-flow (shared flow) within a parent flow.
 * Sub-flows are reusable flow components like authentication, navigation,
 * or common setup procedures that are called from multiple main flows.
 *
 * @requires Maestro GraalJS environment
 * @requires start-flow.ts to have been run first (parent flow must be active)
 *
 * Environment Variables:
 * - SUB_FLOW_NAME: Name of the sub-flow being started (e.g., 'shared-login')
 *
 * Output Variables Set:
 * - PARENT_FLOW_NAME: Preserved name of the parent flow
 * - SUB_FLOW_START_TIME: Timestamp when the sub-flow started
 *
 * Metrics Emitted:
 * - sub_flow_start event with parent flow, sub-flow name, and context
 *
 * Note: Sub-flows track their own duration while preserving the parent flow context.
 * This allows for hierarchical performance analysis.
 */

import { bufferMetric } from '../utils/bufferMetric'
import { emitMetric } from '../utils/emitMetric'
import { getTimestampString } from '../utils/getTimestamp'
import { createSubFlowStartMetric } from '../utils/metricCreators'
import { getEnvVar } from '../utils/validateEnv'

// Get sub-flow name from environment, with safe fallback
const subFlowName = getEnvVar('SUB_FLOW_NAME', 'unknown-sub-flow')

// Preserve current flow as parent for context
const parentFlowName = output.CURRENT_FLOW_NAME || 'unknown'

// Store parent flow context and sub-flow start time
output.PARENT_FLOW_NAME = parentFlowName
output.SUB_FLOW_START_TIME = getTimestampString()

// Create sub_flow_start metric
const metric = createSubFlowStartMetric({
  parentFlowName,
  subFlowName,
  timestamp: parseInt(output.SUB_FLOW_START_TIME, 10),
  platform: output.CURRENT_PLATFORM,
  testRunId: output.CURRENT_TEST_RUN_ID,
})

// Emit sub_flow_start metric for local processing
emitMetric(metric)

// Append metric to buffer for cloud upload
bufferMetric(metric, output)

// Log for debugging with parent context
console.log(`Started sub-flow: ${subFlowName} (parent: ${parentFlowName})`)
