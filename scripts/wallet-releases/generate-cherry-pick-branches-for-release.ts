#!/usr/bin/env ts-node
/*
 * generate-cherry-pick-branches-for-release.ts
 *
 * Usage: bunx ts-node ./scripts/wallet-releases/generate-cherry-pick-branches-for-release.ts
 *
 * This script interactively prompts for mobile and extension version numbers and a temp name, then automates the process of creating cherry-pick branches for release management.
 *
 * NOTE: This script runs git commands and will modify your working directory.
 */

import { execSync } from 'child_process'
import inquirer from 'inquirer'

function logStep(message: string) {
  console.log(`\n=== ${message} ===`)
}

function runGitCommand(command: string, step: string): Buffer {
  logStep(`Running: ${command}`)
  try {
    const output = execSync(command, { stdio: 'inherit' })
    logStep(`${step} completed.`)

    return output
  } catch (error) {
    console.error(`Error during: ${step}`)
    process.exit(1)
  }
}

function validateVersion(input: string) {
  return /^\d+\.\d+(\.\d+)?$/.test(input) || 'Please enter a valid version (e.g., 1.15 or 1.15.0)'
}

function validateTempName(input: string) {
  return input.trim().length > 0 || 'Temp name cannot be empty'
}

async function main() {
  console.log('\nCherry-pick Branch Generator for Release Management\n')
  console.log(
    'This script interactively prompts for mobile and extension version numbers and a temp name, then automates the process of creating cherry-pick branches for release management.\nNOTE: This script runs git commands and will modify your working directory.',
  )
  console.log('---------------------------------------------------')

  const { mobileVersion, extensionVersion, tempName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'mobileVersion',
      message: 'Enter the mobile app version (i.e. 1.15):',
      validate: validateVersion,
    },
    {
      type: 'input',
      name: 'extensionVersion',
      message: 'Enter the extension version (i.e. 1.8.0):',
      validate: validateVersion,
    },
    {
      type: 'input',
      name: 'tempName',
      message: 'Enter a temp name for the cherry-pick branches (i.e. cherry-picks-1):',
      validate: validateTempName,
    },
  ])

  console.log('\nSummary:')
  console.log(`  Mobile version: ${mobileVersion}`)
  console.log(`  Extension version: ${extensionVersion}`)
  console.log(`  Temp name: ${tempName}`)

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with these values?',
      default: true,
    },
  ])

  if (!confirm) {
    console.log('Aborted by user.')
    process.exit(0)
  }

  // Checkout main and pull
  runGitCommand('git checkout main', 'Checkout main branch')
  runGitCommand('git pull origin main', 'Pull latest main')

  // Extension branch
  const extensionReleaseBranch = `releases/extension/${extensionVersion}`
  const extensionCherryBranch = `cherry-pick/extension/${extensionVersion}-${tempName}`
  runGitCommand(`git checkout ${extensionReleaseBranch}`, `Checkout ${extensionReleaseBranch}`)
  runGitCommand('git pull', `Pull latest for ${extensionReleaseBranch}`)
  runGitCommand(`git checkout -b ${extensionCherryBranch}`, `Create branch ${extensionCherryBranch}`)

  // Mobile branch
  const mobileReleaseBranch = `releases/mobile/${mobileVersion}`
  const mobileCherryBranch = `cherry-pick/mobile/${mobileVersion}-${tempName}`
  runGitCommand(`git checkout ${mobileReleaseBranch}`, `Checkout ${mobileReleaseBranch}`)
  runGitCommand('git pull', `Pull latest for ${mobileReleaseBranch}`)
  runGitCommand(`git checkout -b ${mobileCherryBranch}`, `Create branch ${mobileCherryBranch}`)

  logStep('All done!')
  console.log(`\nCreated branches:\n  ${extensionCherryBranch}\n  ${mobileCherryBranch}`)
  console.log('You can now cherry-pick your commits and push the branches as needed.')
}

main()
