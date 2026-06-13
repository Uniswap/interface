#!/usr/bin/env ts-node

/**
 * Interactive script to run E2E tests with flow selection and metro bundler option
 * This script is called by the bun e2e:interactive command
 */

import type { ChildProcess } from 'child_process'
import { execSync, spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const escapeVariable = (variable: string): string => variable.replace(/'/g, "'\\''")
const escapeShellArg = (arg: string): string => `'${arg.replace(/'/g, "'\\''")}'`

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
    throw new Error('E2E_RECOVERY_PHRASE environment variable is required')
  }

  return { E2E_RECOVERY_PHRASE, DATADOG_API_KEY }
}

// ... (rest of the code remains the same)

// Vulnerable call fix
const E2E_RECOVERY_PHRASE = validateEnvironment().E2E_RECOVERY_PHRASE
execSync(`maestro test -e E2E_RECOVERY_PHRASE=${escapeShellArg(E2E_RECOVERY_PHRASE)}`)