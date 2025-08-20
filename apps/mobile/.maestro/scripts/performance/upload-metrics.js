/**
 * Maestro E2E Performance Tracking - Datadog Upload Script
 *
 * Uploads accumulated metrics from the buffer to Datadog API.
 * This script is designed to run at the end of each test flow to submit
 * all collected performance metrics to Datadog for monitoring and analysis.
 *
 * @requires Maestro GraalJS environment
 * @requires init-tracking.js to have been run first (initializes METRICS_BUFFER)
 *
 * Environment Variables (passed as direct variables in GraalJS):
 * - DATADOG_API_KEY: Required for API authentication
 * - DATADOG_API_URL_OVERRIDE: Optional, override for different Datadog regions (EU, gov cloud)
 * - ENVIRONMENT: Optional, defaults to 'maestro_cloud' (vs 'local')
 * - DRY_RUN: Optional, if 'true' will only log what would be sent
 *
 * Output Variables Used:
 * - METRICS_BUFFER: JSON string array of all metrics collected during the test
 * - CURRENT_TEST_RUN_ID: Unique test run identifier for correlation
 * - CURRENT_PLATFORM: Platform being tested (ios/android)
 */

// Get configuration from environment
const apiKey = DATADOG_API_KEY || ''
const environment = ENVIRONMENT || 'maestro_cloud'
const isDryRun = DRY_RUN === 'true'

// Datadog API endpoint (configurable for different regions)
const DATADOG_API_URL = DATADOG_API_URL_OVERRIDE || 'https://api.datadoghq.com/api/v1/series'

/**
 * Parse metrics from the buffer
 * @returns {Array} Array of metric objects
 */
function parseMetricsBuffer() {
  try {
    const bufferContent = output.METRICS_BUFFER || '[]'
    return JSON.parse(bufferContent)
  } catch (e) {
    console.log('Error parsing metrics buffer: ' + e.message)
    return []
  }
}

/**
 * Convert metrics to Datadog series format
 * @param {Array} metrics - Array of raw metrics
 * @returns {Array} Array of Datadog series objects
 */
function convertToDatadogFormat(metrics) {
  const series = []
  const baseTags = [
    'env:' + environment,
    'test_run_id:' + (output.CURRENT_TEST_RUN_ID || 'unknown'),
    'platform:' + (output.CURRENT_PLATFORM || 'unknown'),
  ]

  for (let i = 0; i < metrics.length; i++) {
    const metric = metrics[i]
    const timestamp = Math.floor((metric.timestamp || Date.now()) / 1000)

    // Handle action metrics
    if (metric.type === 'action') {
      const actionTags = [...baseTags]

      // Add tags only if properties exist
      if (metric.flowName != null) actionTags.push('flow_name:' + metric.flowName)
      if (metric.actionType != null) actionTags.push('action_type:' + metric.actionType)
      if (metric.actionTarget != null) actionTags.push('action_target:' + metric.actionTarget)
      if (metric.status != null) actionTags.push('status:' + metric.status)
      if (metric.stepNumber != null) actionTags.push('step_number:' + metric.stepNumber)

      series.push({
        metric: 'maestro.e2e.action.duration',
        points: [[timestamp, metric.duration]],
        type: 'gauge',
        tags: actionTags,
      })
    }
    // Handle flow end events
    else if (metric.event === 'flow_end') {
      const flowTags = [...baseTags]

      // Add tags only if properties exist
      if (metric.flowName != null) flowTags.push('flow_name:' + metric.flowName)
      if (metric.status != null) flowTags.push('status:' + metric.status)

      series.push({
        metric: 'maestro.e2e.flow.duration',
        points: [[timestamp, metric.duration]],
        type: 'gauge',
        tags: flowTags,
      })

      // Also send flow count metric
      series.push({
        metric: 'maestro.e2e.flow.count',
        points: [[timestamp, 1]],
        type: 'count',
        tags: flowTags,
      })
    }
    // Handle sub-flow end events
    else if (metric.event === 'sub_flow_end') {
      const subFlowTags = [...baseTags]

      // Add tags only if properties exist
      if (metric.parentFlowName != null) subFlowTags.push('parent_flow_name:' + metric.parentFlowName)
      if (metric.subFlowName != null) subFlowTags.push('sub_flow_name:' + metric.subFlowName)
      if (metric.status != null) subFlowTags.push('status:' + metric.status)

      series.push({
        metric: 'maestro.e2e.sub_flow.duration',
        points: [[timestamp, metric.duration]],
        type: 'gauge',
        tags: subFlowTags,
      })
    }
  }

  return series
}

/**
 * Send a single batch of metrics to Datadog via HTTP POST
 * @param {Array} series - Array of Datadog series objects
 * @returns {boolean} Success status
 */
function sendBatchToDatadog(series) {
  if (isDryRun) {
    console.log('[DRY RUN] Would send ' + series.length + ' metric series to Datadog')
    console.log('[DRY RUN] Payload: ' + JSON.stringify({ series: series }, null, 2))
    return true
  }

  if (!apiKey) {
    console.log('Error: DATADOG_API_KEY is required')
    return false
  }

  try {
    const payload = JSON.stringify({ series: series })

    // Use Maestro's http API
    const response = http.post(DATADOG_API_URL, {
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': apiKey,
      },
      body: payload,
    })

    // Check response status
    if (response.status === 202) {
      console.log('Successfully uploaded ' + series.length + ' metrics to Datadog')
      return true
    } else {
      console.log('Failed to upload metrics. Status: ' + response.status)
      console.log('Response: ' + response.body)
      return false
    }
  } catch (e) {
    console.log('Error uploading metrics to Datadog: ' + e.message)
    return false
  }
}

/**
 * Send metrics to Datadog with retry logic and batch processing
 * @param {Array} series - Array of Datadog series objects
 * @returns {boolean} Overall success status
 */
function sendToDatadog(series) {
  // Process in chunks to respect API limits (Datadog has a 5MB limit)
  const BATCH_SIZE = 100 // Adjust based on typical metric size
  let overallSuccess = true

  for (let i = 0; i < series.length; i += BATCH_SIZE) {
    const batch = series.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(series.length / BATCH_SIZE)

    console.log('Processing batch ' + batchNumber + '/' + totalBatches + ' (' + batch.length + ' metrics)')

    // Retry logic with exponential backoff
    const maxRetries = 3
    let attempt = 0
    let success = false

    while (attempt < maxRetries && !success) {
      success = sendBatchToDatadog(batch)

      if (!success) {
        attempt++
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
          console.log(
            'Retry ' + attempt + '/' + maxRetries + ' for batch ' + batchNumber + ' after ' + delay + 'ms delay',
          )
          // Note: GraalJS may not have setTimeout, but we'll document this limitation
          // In practice, the delay here is more for logging than actual waiting
        }
      }
    }

    if (!success) {
      console.log('Failed to upload batch ' + batchNumber + ' after ' + maxRetries + ' attempts')
      overallSuccess = false
      // Continue with remaining batches rather than failing completely
    }
  }

  return overallSuccess
}

/**
 * Generate summary of metrics being uploaded
 * @param {Array} metrics - Array of raw metrics
 */
function logMetricsSummary(metrics) {
  let actionCount = 0
  let flowCount = 0
  let subFlowCount = 0

  for (let i = 0; i < metrics.length; i++) {
    const metric = metrics[i]
    if (metric.type === 'action') actionCount++
    else if (metric.event === 'flow_end') flowCount++
    else if (metric.event === 'sub_flow_end') subFlowCount++
  }

  console.log('Metrics summary:')
  console.log('  Actions tracked: ' + actionCount)
  console.log('  Flows completed: ' + flowCount)
  console.log('  Sub-flows completed: ' + subFlowCount)
  console.log('  Total metrics: ' + metrics.length)
}

// Main execution
console.log('Starting Datadog metrics upload...')

// Parse metrics from buffer
const metrics = parseMetricsBuffer()

if (metrics.length === 0) {
  console.log('No metrics found in buffer, skipping upload')
} else {
  // Log summary
  logMetricsSummary(metrics)

  // Convert to Datadog format
  const series = convertToDatadogFormat(metrics)

  // Send to Datadog
  const success = sendToDatadog(series)

  if (success) {
    // Clear buffer after successful upload
    output.METRICS_BUFFER = '[]'
    console.log('Metrics buffer cleared')
  }
}
