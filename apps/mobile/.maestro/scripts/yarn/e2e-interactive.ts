#!/usr/bin/env ts-node

/**
 * Interactive script to run E2E tests with flow selection and metro bundler option
 * This script is called by the yarn e2e:interactive command
 */

import type { ChildProcess } from 'child_process'
import { execSync, spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const escapeVariable = (variable: string): string => variable.replace(/'/g, "'\\''")

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
} as const

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Helper function to ask questions
const askQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// Helper function to find all YAML files recursively
function findYamlFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = []
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      results = results.concat(findYamlFiles(filePath, baseDir))
    } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      // Get relative path from flows directory
      const relativePath = path.relative(baseDir, filePath)
      results.push(relativePath)
    }
  }

  return results
}

// Track Metro process globally for cleanup
let globalMetroProcess: ChildProcess | undefined

// Helper function to validate environment
function validateEnvironment(): { E2E_RECOVERY_PHRASE: string; DATADOG_API_KEY?: string } {
  const E2E_RECOVERY_PHRASE = process.env.E2E_RECOVERY_PHRASE
  const DATADOG_API_KEY = process.env.DATADOG_API_KEY

  if (!E2E_RECOVERY_PHRASE) {
    console.error(`${colors.red}Error: E2E_RECOVERY_PHRASE environment variable is required${colors.reset}`)
    console.error('Please set it before running this command:')
    console.error(`  ${colors.yellow}export E2E_RECOVERY_PHRASE="your recovery phrase here"${colors.reset}`)
    process.exit(1)
  }

  return { E2E_RECOVERY_PHRASE, DATADOG_API_KEY }
}

// Helper function to get test files
function getTestFiles(): string[] {
  const flowsDir = path.join(process.cwd(), '.maestro/flows')
  console.log(`${colors.dim}Scanning for test flows in: ${flowsDir}${colors.reset}\n`)

  let yamlFiles: string[] = []
  try {
    yamlFiles = findYamlFiles(flowsDir, flowsDir)
  } catch (error) {
    console.error(`${colors.red}Error scanning for YAML files: ${(error as Error).message}${colors.reset}`)
    process.exit(1)
  }

  if (yamlFiles.length === 0) {
    console.error(`${colors.red}No YAML test files found in ${flowsDir}${colors.reset}`)
    process.exit(1)
  }

  yamlFiles.sort()
  return yamlFiles
}

// Helper function to select flows
async function selectFlows(yamlFiles: string[]): Promise<{ selectedFlows: string[]; selectionDescription: string }> {
  // Display available flows
  console.log(`${colors.green}Available test flows:${colors.reset}`)
  console.log(`  ${colors.cyan}0)${colors.reset} ${colors.green}Run all tests${colors.reset}`)
  yamlFiles.forEach((file, index) => {
    console.log(`  ${colors.cyan}${index + 1})${colors.reset} ${file}`)
  })
  console.log('')

  // Ask user to select a flow
  let selection: number
  while (true) {
    const answer = await askQuestion(`${colors.yellow}Select a flow to run (0-${yamlFiles.length}): ${colors.reset}`)
    selection = parseInt(answer, 10)

    if (selection >= 0 && selection <= yamlFiles.length) {
      break
    }
    console.log(
      `${colors.red}Invalid selection. Please enter a number between 0 and ${yamlFiles.length}.${colors.reset}`,
    )
  }

  let selectedFlows: string[]
  let selectionDescription: string

  if (selection === 0) {
    selectedFlows = yamlFiles
    selectionDescription = 'all tests'
  } else {
    const selectedFile = yamlFiles[selection - 1]
    if (!selectedFile) {
      throw new Error(`Invalid selection: ${selection}`)
    }
    selectedFlows = [selectedFile]
    selectionDescription = selectedFile
  }

  console.log(`\n${colors.green}Selected:${colors.reset} ${selectionDescription}\n`)

  return { selectedFlows, selectionDescription }
}

// Helper function to start Metro bundler
async function startMetro(): Promise<ChildProcess | undefined> {
  const answer = await askQuestion(`${colors.yellow}Start Metro bundler for E2E environment? (y/n): ${colors.reset}`)
  const shouldStartMetro = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes'
  rl.close()

  if (!shouldStartMetro) {
    return undefined
  }

  console.log(`\n${colors.cyan}Starting Metro bundler...${colors.reset}`)
  console.log(`${colors.dim}Metro logs will appear below. The E2E test will start in 8 seconds...${colors.reset}\n`)

  // Start Metro in a child process but keep it attached to show logs
  const metroProcess = spawn('yarn', ['start:e2e'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    shell: true,
    detached: true,
  })

  // Set global reference for cleanup
  globalMetroProcess = metroProcess

  // Handle Metro process errors
  metroProcess.on('error', (error) => {
    console.error(`${colors.red}Failed to start Metro: ${error.message}${colors.reset}`)
    process.exit(1)
  })

  // Give Metro time to start and show initial logs
  await new Promise((resolve) => setTimeout(resolve, 8000))
  console.log(`\n${colors.green}Metro bundler should be running. Starting E2E test...${colors.reset}\n`)

  return metroProcess
}

interface TestRunOptions {
  selectedFlows: string[]
  selectionDescription: string
  E2E_RECOVERY_PHRASE: string
  DATADOG_API_KEY?: string
}

// Helper function to run tests
async function runTests(options: TestRunOptions): Promise<void> {
  const { selectedFlows, selectionDescription, E2E_RECOVERY_PHRASE, DATADOG_API_KEY } = options
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`)
  console.log(
    `${colors.cyan}Running E2E test${selectedFlows.length > 1 ? 's' : ''}: ${selectionDescription}${colors.reset}`,
  )
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`)

  // Properly escape the recovery phrase to prevent command injection
  const escapedRecoveryPhrase = escapeVariable(E2E_RECOVERY_PHRASE)
  const escapedDatadogApiKey = DATADOG_API_KEY ? escapeVariable(DATADOG_API_KEY) : ''

  const failedTests: string[] = []
  const passedTests: string[] = []

  // Run tests sequentially
  for (let i = 0; i < selectedFlows.length; i++) {
    const testFile = selectedFlows[i]
    if (!testFile) {
      throw new Error(`Invalid test file at index ${i}`)
    }

    if (selectedFlows.length > 1) {
      console.log(`\n${colors.cyan}[${i + 1}/${selectedFlows.length}] Running: ${testFile}${colors.reset}\n`)
    }

    try {
      execSync(
        `maestro test -e E2E_RECOVERY_PHRASE='${escapedRecoveryPhrase}' -e DATADOG_API_KEY='${escapedDatadogApiKey}' .maestro/flows/${testFile}`,
        {
          stdio: 'inherit',
          env: {
            ...process.env,
            DATADOG_API_KEY,
            E2E_RECOVERY_PHRASE,
            MAESTRO_DRIVER_STARTUP_TIMEOUT: '120000',
          },
        },
      )
      passedTests.push(testFile)
      if (selectedFlows.length > 1) {
        console.log(`${colors.green}✅ ${testFile} passed${colors.reset}`)
      }
    } catch (error) {
      failedTests.push(testFile)
      if (selectedFlows.length > 1) {
        console.error(`${colors.red}❌ ${testFile} failed${colors.reset}`)
      } else {
        throw error // Re-throw for single test to maintain existing behavior
      }
    }
  }

  // Print summary for multiple tests
  if (selectedFlows.length > 1) {
    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`)
    console.log(`${colors.cyan}Test Summary:${colors.reset}`)
    console.log(`${colors.green}Passed: ${passedTests.length}${colors.reset}`)
    console.log(`${colors.red}Failed: ${failedTests.length}${colors.reset}`)

    if (failedTests.length > 0) {
      console.log(`\n${colors.red}Failed tests:${colors.reset}`)
      failedTests.forEach((test) => console.log(`  ${colors.red}- ${test}${colors.reset}`))
    }

    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`)

    if (failedTests.length > 0) {
      throw new Error(`${failedTests.length} test(s) failed`)
    }
  }

  console.log(
    `\n${colors.green}✅ E2E test${selectedFlows.length > 1 ? 's' : ''} completed successfully!${colors.reset}`,
  )
}

// Main function
async function main(): Promise<void> {
  console.log(`${colors.cyan}🎭 Maestro E2E Interactive Test Runner${colors.reset}\n`)

  // Validate environment
  const { E2E_RECOVERY_PHRASE, DATADOG_API_KEY } = validateEnvironment()

  // Change to apps/mobile directory
  const mobileDir = path.resolve(__dirname, '../../../')
  process.chdir(mobileDir)

  // Get test files
  const yamlFiles = getTestFiles()

  // Select flows
  const { selectedFlows, selectionDescription } = await selectFlows(yamlFiles)

  // Start metro if requested
  const metroProcess = await startMetro()

  try {
    // Run the selected test(s)
    await runTests({ selectedFlows, selectionDescription, E2E_RECOVERY_PHRASE, DATADOG_API_KEY })
  } catch (_error) {
    console.error(`\n${colors.red}❌ E2E test${selectedFlows.length > 1 ? 's' : ''} failed${colors.reset}`)
    if (metroProcess) {
      console.log(`${colors.yellow}Stopping Metro bundler...${colors.reset}`)
      metroProcess.kill()
    }
    process.exit(1)
  }

  // Clean up Metro process if it was started
  if (metroProcess) {
    console.log(`\n${colors.yellow}Stopping Metro bundler...${colors.reset}`)
    metroProcess.kill()
  }

  console.log(`\n${colors.cyan}🎭 E2E test session complete!${colors.reset}`)
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Interrupted by user${colors.reset}`)
  if (globalMetroProcess) {
    console.log(`${colors.yellow}Stopping Metro bundler...${colors.reset}`)
    try {
      if (globalMetroProcess.pid) {
        process.kill(-globalMetroProcess.pid)
      }
    } catch (_e) {
      globalMetroProcess.kill('SIGTERM')
    }
  }
  process.exit(0)
})

process.on('exit', () => {
  if (globalMetroProcess) {
    try {
      if (globalMetroProcess.pid) {
        process.kill(-globalMetroProcess.pid)
      }
    } catch (_e) {
      globalMetroProcess.kill('SIGTERM')
    }
  }
})

// Run the main function
main().catch((error) => {
  console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`)
  process.exit(1)
})
