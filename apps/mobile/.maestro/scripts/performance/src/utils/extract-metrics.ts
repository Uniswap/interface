/**
 * Extract MAESTRO_METRIC lines from Maestro test logs
 */

import { exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Type for exec errors which include stderr
interface ExecError extends Error {
  stderr?: string
  stdout?: string
}

/**
 * Find all log files in the test directory
 */
async function findLogFiles(testDir: string): Promise<string[]> {
  const logFiles: string[] = []

  async function walkDir(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      return
    }

    const entries = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Look for logs directories in CI artifacts
        if (entry.name === 'logs' || fullPath.includes(`${path.sep}logs${path.sep}`)) {
          await walkDir(fullPath)
        } else {
          await walkDir(fullPath)
        }
      } else if (entry.isFile()) {
        // Include .log files and .txt files in logs directories
        if (entry.name.endsWith('.log') || (fullPath.includes('/logs/') && entry.name.endsWith('.txt'))) {
          logFiles.push(fullPath)
        }
      }
    }
  }

  await walkDir(testDir)
  return logFiles
}

/**
 * Extract JSON objects from a line containing MAESTRO_METRIC
 */
function extractMetricsFromLine(line: string): string[] {
  const metrics: string[] = []
  let currentPos = 0

  while (true) {
    const metricIndex = line.indexOf('MAESTRO_METRIC:', currentPos)
    if (metricIndex === -1) {
      break
    }

    const jsonStart = metricIndex + 'MAESTRO_METRIC:'.length
    const jsonStr = line.substring(jsonStart)

    // Parse JSON object by counting braces
    let braceCount = 0
    let inString = false
    let escapeNext = false
    let jsonEnd = -1

    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i]

      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      if (char === '"' && !inString) {
        inString = true
      } else if (char === '"' && inString) {
        inString = false
      }

      if (!inString) {
        if (char === '{') {
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0) {
            jsonEnd = i + 1
            break
          }
        }
      }
    }

    if (jsonEnd > 0) {
      const metric = jsonStr.substring(0, jsonEnd)
      try {
        // Validate that it's valid JSON
        JSON.parse(metric)
        metrics.push(metric)
      } catch {
        // Skip invalid JSON
      }
      currentPos = jsonStart + jsonEnd
    } else {
      break
    }
  }

  return metrics
}

/**
 * Extract metrics from all log files
 */
async function extractMetrics(logFiles: string[]): Promise<Set<string>> {
  const allMetrics = new Set<string>()

  for (const logFile of logFiles) {
    console.error(`Processing: ${logFile}`)

    try {
      const content = await fs.promises.readFile(logFile, 'utf-8')
      const lines = content.split('\n')

      for (const line of lines) {
        if (line.includes('MAESTRO_METRIC:')) {
          const metrics = extractMetricsFromLine(line)
          metrics.forEach((m) => allMetrics.add(m))
        }
      }
    } catch (error) {
      console.error(`Error reading ${logFile}:`, error)
    }
  }

  return allMetrics
}

/**
 * Process metrics to add missing flow_end events for failed flows
 */
async function processMetrics(tempFile: string, outputFile: string): Promise<void> {
  // The process-metrics.js is in the same directory after compilation
  const processMetricsScript = path.join(__dirname, 'process-metrics.js')

  if (!fs.existsSync(processMetricsScript)) {
    throw new Error(`process-metrics.js not found at ${processMetricsScript}`)
  }

  try {
    await execAsync(`node "${processMetricsScript}" "${tempFile}" "${outputFile}"`)
  } catch (error) {
    const execError = error as ExecError
    const errorMessage = execError.stderr || execError.message || String(error)
    throw new Error(`Failed to process metrics: ${errorMessage}`)
  }

  if (!fs.existsSync(outputFile)) {
    throw new Error(`Output file ${outputFile} was not created`)
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2)
  const testDir = args[0] || path.join(process.env.HOME || '', '.maestro', 'tests')
  const outputFile = args[1] || 'metrics.jsonl'
  const tempFile = `${outputFile}.tmp`

  console.log('Extracting metrics from Maestro test logs...')
  console.log(`Test directory: ${testDir}`)
  console.log(`Output file: ${outputFile}`)

  try {
    // Find all log files
    const logFiles = await findLogFiles(testDir)

    if (logFiles.length === 0) {
      console.log('No log files found')
      return
    }

    console.log(`Found ${logFiles.length} log files`)

    // Extract metrics from all files
    const metrics = await extractMetrics(logFiles)

    // Write unique metrics to temp file
    await fs.promises.writeFile(tempFile, Array.from(metrics).join('\n') + '\n')

    // Process metrics to add missing flow_end events
    await processMetrics(tempFile, outputFile)

    // Clean up temp file
    await fs.promises.unlink(tempFile)

    // Count and display results
    const outputContent = await fs.promises.readFile(outputFile, 'utf-8')
    const metricLines = outputContent
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
    const metricCount = metricLines.length

    console.log(`Extracted ${metricCount} metrics to ${outputFile}`)

    if (metricCount > 0) {
      console.log('')
      console.log('Sample metrics:')
      metricLines.slice(0, 5).forEach((line) => console.log(line))
    }
  } catch (error) {
    console.error('Error:', error)

    // Clean up temp file on error
    if (fs.existsSync(tempFile)) {
      await fs.promises.unlink(tempFile)
    }

    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
