#!/usr/bin/env node

/**
 * Maestro E2E Performance Tracking - Datadog Metrics Submission Script
 *
 * Production-ready script to submit E2E performance metrics to Datadog.
 * Supports both local development and CI/CD pipeline usage with automatic
 * environment detection and appropriate tagging.
 *
 * Features:
 * - Batch submission of metrics to Datadog API
 * - Automatic CI environment detection (GitHub Actions, etc.)
 * - Dry-run mode for testing without submission
 * - Comprehensive metric summarization
 * - Tag deduplication to prevent duplicate tags
 *
 * Usage:
 *   node submit-metrics.js [options]
 *
 * Options:
 *   --file <path>     Path to metrics JSONL file (default: metrics.jsonl)
 *   --dry-run         Show what would be sent without actually sending
 *   --api-key <key>   Datadog API key (can also use DATADOG_API_KEY env var)
 *   --test-run-id     Test run ID (defaults to timestamp)
 *   --tags <tags>     Additional tags (comma-separated, e.g., "env:prod,branch:main")
 *   --help            Show help message
 *
 * Environment Variables:
 *   DATADOG_API_KEY   Required for actual submission (not needed for dry-run)
 *   CI                Automatically detected for CI environment tagging
 *   GITHUB_REF        Used to extract branch name in GitHub Actions
 *   GITHUB_SHA        Used to tag with commit SHA in GitHub Actions
 *   GITHUB_RUN_ID     Used to correlate with GitHub Actions run
 *
 * Metrics Submitted:
 *   - maestro.e2e.action.duration: Individual UI action durations
 *   - maestro.e2e.flow.duration: Complete test flow durations
 *   - maestro.e2e.flow.count: Flow execution counts (success/failure)
 *   - maestro.e2e.sub_flow.duration: Sub-flow (shared flow) durations
 */

const fs = require('fs')
const https = require('https')
const path = require('path')

/**
 * Parse command line arguments into options object
 * @param {string[]} args - Process argv array
 * @returns {Object} Parsed options with defaults
 */
function parseArgs(args) {
  const options = {
    file: 'metrics.jsonl',
    dryRun: false,
    apiKey: process.env.DATADOG_API_KEY,
    testRunId: Date.now().toString(),
    tags: [],
  }

  for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
        if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
          console.error('Error: --file requires a value')
          process.exit(1)
        }
        options.file = args[++i]
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--api-key':
        if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
          console.error('Error: --api-key requires a value')
          process.exit(1)
        }
        options.apiKey = args[++i]
        break
      case '--test-run-id':
        if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
          console.error('Error: --test-run-id requires a value')
          process.exit(1)
        }
        options.testRunId = args[++i]
        break
      case '--tags':
        if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
          console.error('Error: --tags requires a value')
          process.exit(1)
        }
        const tagValue = args[++i]
        options.tags = tagValue ? tagValue.split(',') : []
        break
      case '--help':
        showHelp()
        process.exit(0)
    }
  }

  return options
}

/**
 * Display help message with usage instructions
 */
function showHelp() {
  console.log(`
E2E Performance Metrics Submission Tool

Usage: node submit-metrics.js [options]

Options:
  --file <path>      Path to metrics JSONL file (default: metrics.jsonl)
  --dry-run          Show what would be sent without actually sending
  --api-key <key>    Datadog API key (can also use DATADOG_API_KEY env var)
  --test-run-id      Test run ID (defaults to timestamp)
  --tags <tags>      Additional tags (comma-separated, e.g., "env:prod,branch:main")
  --help             Show this help message

Environment Variables:
  DATADOG_API_KEY    Datadog API key
  CI                 Automatically detected CI environment
  GITHUB_REF         Git branch (GitHub Actions)
  GITHUB_SHA         Git commit SHA (GitHub Actions)
  GITHUB_RUN_ID      GitHub Actions run ID
`)
}

/**
 * Read and parse metrics from JSONL file
 * @param {string} filePath - Path to the metrics file
 * @returns {{metrics: Array, flows: Array}} Separated action metrics and flow events
 * @throws {Error} If file doesn't exist or parsing fails
 */
function readMetrics(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Metrics file not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n').filter((line) => line.trim())

  const metrics = [] // Action metrics (type: 'action')
  const flows = [] // Flow events (event: 'flow_start/end', 'sub_flow_start/end')

  // Parse each line of JSONL
  lines.forEach((line, index) => {
    try {
      const data = JSON.parse(line)
      // Separate flow events from action metrics
      if (data.event) {
        flows.push(data)
      } else if (data.type === 'action') {
        metrics.push(data)
      }
    } catch (e) {
      console.warn(`Failed to parse line ${index + 1}: ${e.message}`)
    }
  })

  return { metrics, flows }
}

/**
 * Remove duplicate tags from an array
 * @param {string[]} tags - Array of tag strings
 * @returns {string[]} Array with duplicates removed
 */
function deduplicateTags(tags) {
  return [...new Set(tags)]
}

/**
 * Build Datadog metric series from parsed metrics and flows
 * @param {Array} metrics - Action metrics array
 * @param {Array} flows - Flow events array
 * @param {Object} options - Command line options including tags
 * @returns {Array} Array of Datadog metric series objects
 */
function buildMetricSeries(metrics, flows, options) {
  const series = []
  const baseTags = [...options.tags]

  // Add CI-specific tags if running in CI
  if (process.env.CI) {
    baseTags.push('env:ci')
    if (process.env.GITHUB_REF) {
      const branch = process.env.GITHUB_REF.replace('refs/heads/', '')
      baseTags.push(`branch:${branch}`)
    }
    if (process.env.GITHUB_SHA) {
      baseTags.push(`commit:${process.env.GITHUB_SHA.substring(0, 8)}`)
    }
    if (process.env.GITHUB_RUN_ID) {
      baseTags.push(`github_run_id:${process.env.GITHUB_RUN_ID}`)
    }
  } else {
    baseTags.push('env:local')
  }

  // Action duration metrics
  metrics.forEach((metric) => {
    // Use the testRunId from the metric itself
    const metricTags = [...baseTags]
    if (metric.testRunId) {
      metricTags.push(`test_run_id:${metric.testRunId}`)
    }

    series.push({
      metric: 'maestro.e2e.action.duration',
      points: [[Math.floor(metric.timestamp / 1000), metric.duration]],
      type: 'gauge',
      tags: deduplicateTags([
        ...metricTags,
        `flow_name:${metric.flowName}`,
        `action_type:${metric.actionType}`,
        `action_target:${metric.actionTarget}`,
        `platform:${metric.platform}`,
        `status:${metric.status}`,
        `step_number:${metric.stepNumber}`,
      ]),
    })
  })

  // Flow duration metrics
  flows
    .filter((f) => f.event === 'flow_end')
    .forEach((flow) => {
      // Use the testRunId from the flow itself
      const flowTags = [...baseTags]
      if (flow.testRunId) {
        flowTags.push(`test_run_id:${flow.testRunId}`)
      }

      series.push({
        metric: 'maestro.e2e.flow.duration',
        points: [[Math.floor(flow.timestamp / 1000), flow.duration]],
        type: 'gauge',
        tags: deduplicateTags([
          ...flowTags,
          `flow_name:${flow.flowName}`,
          `platform:${flow.platform}`,
          `status:${flow.status}`,
        ]),
      })

      // Flow success/failure count
      series.push({
        metric: 'maestro.e2e.flow.count',
        points: [[Math.floor(flow.timestamp / 1000), 1]],
        type: 'count',
        tags: deduplicateTags([
          ...flowTags,
          `flow_name:${flow.flowName}`,
          `platform:${flow.platform}`,
          `status:${flow.status}`,
        ]),
      })
    })

  // Sub-flow duration metrics
  flows
    .filter((f) => f.event === 'sub_flow_end')
    .forEach((flow) => {
      // Use the testRunId from the flow itself
      const subFlowTags = [...baseTags]
      if (flow.testRunId) {
        subFlowTags.push(`test_run_id:${flow.testRunId}`)
      }

      series.push({
        metric: 'maestro.e2e.sub_flow.duration',
        points: [[Math.floor(flow.timestamp / 1000), flow.duration]],
        type: 'gauge',
        tags: deduplicateTags([
          ...subFlowTags,
          `parent_flow_name:${flow.parentFlowName}`,
          `sub_flow_name:${flow.subFlowName}`,
          `platform:${flow.platform}`,
          `status:${flow.status}`,
        ]),
      })
    })

  return series
}

/**
 * Send metrics to Datadog API
 * @async
 * @param {Array} series - Array of metric series objects
 * @param {string} apiKey - Datadog API key
 * @param {boolean} dryRun - If true, only log what would be sent
 * @returns {Promise<Object>} Response object with success status
 * @throws {Error} If API request fails
 */
async function sendToDatadog(series, apiKey, dryRun) {
  // Dry run mode - just display what would be sent
  if (dryRun) {
    console.log('\n[DRY RUN] Would send the following metrics:')
    console.log(JSON.stringify({ series }, null, 2))
    return { success: true, dryRun: true }
  }

  const data = JSON.stringify({ series })

  // Make HTTPS request to Datadog API
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.datadoghq.com',
      port: 443,
      path: '/api/v1/series',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'DD-API-KEY': apiKey,
      },
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        // Datadog returns 202 Accepted for successful submissions
        if (res.statusCode === 202) {
          resolve({ success: true, response: body })
        } else {
          reject(new Error(`Datadog API error: ${res.statusCode} - ${body}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.write(data)
    req.end()
  })
}

/**
 * Generate and display a summary report of the metrics
 * @param {Array} metrics - Action metrics array
 * @param {Array} flows - Flow events array
 */
function generateSummary(metrics, flows) {
  console.log('\n=== E2E Performance Summary ===')
  console.log(`Total actions tracked: ${metrics.length}`)
  console.log(`Total flows tracked: ${flows.filter((f) => f.event === 'flow_end').length}`)

  // Calculate flow-level statistics
  const flowStats = {}

  flows
    .filter((f) => f.event === 'flow_end')
    .forEach((flow) => {
      // Initialize stats for new flow
      if (!flowStats[flow.flowName]) {
        flowStats[flow.flowName] = {
          count: 0,
          totalDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          statuses: { success: 0, failure: 0 },
        }
      }

      // Update statistics
      const stats = flowStats[flow.flowName]
      stats.count++
      stats.totalDuration += flow.duration
      stats.minDuration = Math.min(stats.minDuration, flow.duration)
      stats.maxDuration = Math.max(stats.maxDuration, flow.duration)

      // Initialize status counter if it doesn't exist (handles unexpected status values)
      if (!stats.statuses[flow.status]) {
        stats.statuses[flow.status] = 0
      }
      stats.statuses[flow.status]++
    })

  // Display flow statistics
  console.log('\nFlow Statistics:')
  Object.entries(flowStats).forEach(([flowName, stats]) => {
    console.log(`\n${flowName}:`)
    console.log(`  Runs: ${stats.count}`)
    // Handle case where 'success' status might not exist
    const successCount = stats.statuses.success || 0
    console.log(`  Success rate: ${((successCount / stats.count) * 100).toFixed(1)}%`)
    console.log(`  Avg duration: ${(stats.totalDuration / stats.count).toFixed(0)}ms`)
    console.log(`  Min duration: ${stats.minDuration}ms`)
    console.log(`  Max duration: ${stats.maxDuration}ms`)
  })

  // Calculate action-level statistics
  const actionStats = {}

  metrics.forEach((metric) => {
    const key = `${metric.actionType}:${metric.actionTarget}`
    if (!actionStats[key]) {
      actionStats[key] = {
        count: 0,
        totalDuration: 0,
        failures: 0,
      }
    }

    actionStats[key].count++
    actionStats[key].totalDuration += metric.duration
    if (metric.status === 'failure') {
      actionStats[key].failures++
    }
  })

  // Display top 10 slowest actions
  console.log('\nTop 10 Slowest Actions:')
  const sortedActions = Object.entries(actionStats)
    .map(([action, stats]) => ({
      action,
      avgDuration: stats.totalDuration / stats.count,
      count: stats.count,
      failureRate: (stats.failures / stats.count) * 100,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10)

  sortedActions.forEach(({ action, avgDuration, count, failureRate }) => {
    console.log(`  ${action}: ${avgDuration.toFixed(0)}ms (${count} calls, ${failureRate.toFixed(1)}% failure)`)
  })

  console.log('\n===============================\n')
}

/**
 * Main execution function
 * @async
 */
async function main() {
  const options = parseArgs(process.argv)

  // Validate API key for non-dry-run mode
  if (!options.apiKey && !options.dryRun) {
    console.error('Error: Datadog API key is required')
    console.error('Set DATADOG_API_KEY environment variable or use --api-key option')
    process.exit(1)
  }

  try {
    // Read and parse metrics file
    console.log(`Reading metrics from: ${options.file}`)
    const { metrics, flows } = readMetrics(options.file)

    // Check if any metrics were found
    if (metrics.length === 0 && flows.length === 0) {
      console.log('No metrics found in file')
      process.exit(0)
    }

    // Display performance summary
    generateSummary(metrics, flows)

    // Convert to Datadog format
    const series = buildMetricSeries(metrics, flows, options)
    console.log(`Prepared ${series.length} metric series for submission`)

    // Submit to Datadog or display dry-run output
    if (options.dryRun) {
      await sendToDatadog(series, options.apiKey, true)
    } else {
      console.log('Submitting metrics to Datadog...')
      await sendToDatadog(series, options.apiKey, false)
      console.log('✅ Successfully submitted metrics to Datadog')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { readMetrics, buildMetricSeries, sendToDatadog, generateSummary }
