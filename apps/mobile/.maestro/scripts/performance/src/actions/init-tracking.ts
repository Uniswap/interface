/**
 * Maestro E2E Performance Tracking - Initialization Script
 *
 * This script initializes the performance tracking system for a Maestro test flow.
 * It sets up essential tracking variables that will be used throughout the test run
 * to correlate metrics and identify test sessions.
 *
 * @requires Maestro GraalJS environment with 'output' object available
 *
 * Output Variables Set:
 * - CURRENT_FLOW_NAME: Name of the current flow (initialized to 'unknown')
 * - CURRENT_TEST_RUN_ID: Unique identifier for this test run (timestamp-based)
 * - CURRENT_STEP_NUMBER: Counter for tracking action sequence (starts at '0')
 * - CURRENT_PLATFORM: The platform being tested (defaults to 'ios')
 * - METRICS_BUFFER: JSON string array for collecting metrics
 */

/// <reference path="../globals.d.ts" />
import { getTimestampString } from '../utils/getTimestamp'

// Initialize flow name to 'unknown' - will be set by start-flow.ts
output.CURRENT_FLOW_NAME = 'unknown'

// Generate unique test run ID using current timestamp
// This ensures each test run can be uniquely identified in metrics
output.CURRENT_TEST_RUN_ID = getTimestampString()

// Initialize step counter - will be incremented by track-action.ts
output.CURRENT_STEP_NUMBER = '0'

// Set platform - TODO: Make this dynamic based on actual platform
output.CURRENT_PLATFORM = 'ios'

// Initialize metrics buffer for collecting all metrics during the test
// This will be used to upload metrics to Datadog at the end of the flow
output.METRICS_BUFFER = '[]'

// Log initialization for debugging purposes
console.log(`Initialized tracking with test run ID: ${output.CURRENT_TEST_RUN_ID}`)
