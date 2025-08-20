import type { GetTestResult } from 'playwright/fixtures'

interface DataDogPlaywright {
  /**
   * Add custom Datadog tags to a Playwright test
   *
   * These tags will be sent to Datadog Test Optimization for filtering and analysis.
   *
   * @param tags Record of tag names to values
   * @example
   * ```typescript
   * import { addDatadogTags } from '../test-utils/datadog'
   *
   * test('swap should work correctly', async ({ page }) => {
   *   addDatadogTags({
   *     'test.priority': 'critical',
   *     'test.owner': 'web-team',
   *     'test.feature': 'swap',
   *     'test.complexity': 'high'
   *   })
   *
   *   // ... test implementation
   * })
   * ```
   */
  addDatadogTags(tags: Record<string, string | number>): void
  /**
   * Add a custom Datadog measure to a Playwright test
   *
   * Measures are numeric values that can be used for analysis and alerting.
   *
   * @param name The measure name (should be descriptive)
   * @param value The numeric value
   * @example
   * ```typescript
   * import { addDatadogMeasure } from '../test-utils/datadog'
   *
   * test('performance test', async ({ page }) => {
   *   const startTime = Date.now()
   *
   *   // ... perform test actions
   *
   *   const duration = Date.now() - startTime
   *   addDatadogMeasure('test.custom.duration', duration)
   *   addDatadogMeasure('test.memory.usage', 1024)
   * })
   * ```
   */
  addDatadogMeasure(name: string, value: number): void

  /**
   * Add multiple Datadog measures at once
   *
   * @param measures Record of measure names to numeric values
   * @example
   * ```typescript
   * import { addDatadogMeasures } from '../test-utils/datadog'
   *
   * test('resource usage test', async ({ page }) => {
   *   // ... test implementation
   *
   *   addDatadogMeasures({
   *     'test.memory.peak': 2048,
   *     'test.cpu.usage': 85,
   *     'test.network.requests': 12
   *   })
   * })
   * ```
   */
  addDatadogMeasures(measures: Record<string, number>): void
  /**
   * Convenience function to add common Uniswap test tags
   *
   * @param options Object with optional tag values
   * @example
   * ```typescript
   * import { addUniswapTestTags, DATADOG_TAGS } from '../test-utils/datadog'
   *
   * test('swap flow test', async ({ page }) => {
   *   addUniswapTestTags({
   *     priority: DATADOG_TAGS.PRIORITY.CRITICAL,
   *     owner: DATADOG_TAGS.OWNER.SWAP_POD,
   *   })
   *
   *   // ... test implementation
   * })
   * ```
   */
  addUniswapTestTags(options: {
    priority?: string
    owner?: string
    feature?: string
    complexity?: string
    [key: string]: string | undefined
  }): void
}

function _getDatadogPlaywright(ctx: { test: GetTestResult }): DataDogPlaywright {
  const { test } = ctx

  function addDatadogTags(tags: Record<string, string | number>): void {
    Object.entries(tags).forEach(([key, value]) => {
      test.info().annotations.push({
        type: `DD_TAGS[${key}]`,
        description: String(value),
      })
    })
  }

  function addDatadogMeasure(name: string, value: number): void {
    test.info().annotations.push({
      type: `DD_TAGS[${name}]`,
      description: value.toString(),
    })
  }

  function addDatadogMeasures(measures: Record<string, number>): void {
    Object.entries(measures).forEach(([name, value]) => {
      addDatadogMeasure(name, value)
    })
  }

  function addUniswapTestTags(options: {
    priority?: string
    owner?: string
    feature?: string
    complexity?: string
    [key: string]: string | undefined
  }): void {
    const tags: Record<string, string> = {}

    if (options.priority) {
      tags['test.priority'] = options.priority
    }
    if (options.owner) {
      tags['test.owner'] = options.owner
    }
    if (options.feature) {
      tags['test.feature'] = options.feature
    }
    if (options.complexity) {
      tags['test.complexity'] = options.complexity
    }

    // Add any additional custom tags
    Object.entries(options).forEach(([key, value]) => {
      if (value && !['priority', 'owner', 'feature', 'complexity'].includes(key)) {
        tags[key] = value
      }
    })

    if (Object.keys(tags).length > 0) {
      addDatadogTags(tags)
    }
  }
  return {
    addDatadogTags,
    addDatadogMeasure,
    addDatadogMeasures,
    addUniswapTestTags,
  }
}
