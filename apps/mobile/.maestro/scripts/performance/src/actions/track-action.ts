/// <reference path="../globals.d.ts" />

/**
 * Maestro E2E Performance Tracking - Action Tracking Script
 *
 * Tracks individual UI actions (taps, inputs, swipes, etc.) within a test flow.
 * This script is called twice for each action: once at start and once at end.
 * It calculates the duration of each action and emits performance metrics.
 *
 * @requires Maestro GraalJS environment
 * @requires init-tracking.ts and start-flow.ts to have been run first
 *
 * Environment Variables (passed as direct variables in GraalJS):
 * - ACTION: Type of action (e.g., 'tap', 'input', 'swipe')
 * - TARGET: Target element or description (e.g., 'LoginButton', 'EmailField')
 * - PHASE: Either 'start' or 'end' to mark action boundaries
 *
 * Output Variables Modified:
 * - CURRENT_STEP_NUMBER: Incremented for each completed action
 * - [actionKey]_START: Temporary storage for action start times
 *
 * Metrics Emitted:
 * - action metric with type, target, duration, and other context
 */

import { bufferMetric } from '../utils/bufferMetric'
import { emitMetric } from '../utils/emitMetric'
import { getTimestamp } from '../utils/getTimestamp'
import { createActionMetric } from '../utils/metricCreators'
import { getEnvVar } from '../utils/validateEnv'

// Get action details from Maestro environment
// In GraalJS, these are available as direct variables
const action = getEnvVar('ACTION', 'unknown')
const target = getEnvVar('TARGET', 'unknown')
const phase = getEnvVar('PHASE', 'unknown')

// Create unique key for storing start time of this specific action
// This allows tracking multiple concurrent actions if needed
const actionKey = `${action}_${target}`

if (phase === 'start') {
  // Store start timestamp for duration calculation
  output[`${actionKey}_START`] = getTimestamp().toString()
  console.log(`Started ${action} on ${target}`)
} else if (phase === 'end') {
  // Retrieve start time and calculate duration
  const startTimeKey = `${actionKey}_START`
  const startTime = parseInt(output[startTimeKey] || '0', 10)
  const duration = getTimestamp() - startTime

  // Increment step counter to track action sequence
  const currentStep = parseInt(output.CURRENT_STEP_NUMBER || '0', 10)
  output.CURRENT_STEP_NUMBER = (currentStep + 1).toString()

  // Create metric object
  const metric = createActionMetric({
    flowName: output.CURRENT_FLOW_NAME,
    actionType: action,
    actionTarget: target,
    stepNumber: currentStep + 1,
    duration,
    timestamp: startTime,
    status: 'success', // TODO: Add failure tracking
    platform: output.CURRENT_PLATFORM,
    testRunId: output.CURRENT_TEST_RUN_ID,
  })

  // Emit action metric for local processing
  emitMetric(metric)

  // Append metric to buffer for cloud upload
  bufferMetric(metric, output)

  console.log(`Completed ${action} on ${target} in ${duration}ms`)

  // Clean up temporary start time to avoid memory buildup
  delete output[startTimeKey]
}
