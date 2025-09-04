/*
 * find-pr-commits.ts
 *
 * Usage: bunx ts-node ./scripts/wallet-releases/find-pr-commits.ts
 *
 * This script interactively prompts for a list of GitHub PR links, extracts PR numbers, searches recent git commits for each PR, and outputs the mapping, missing PRs, and a cherry-pick command for found commits.
 *
 */

import { execSync } from 'child_process'
import clipboardy from 'clipboardy'
import inquirer from 'inquirer'

function extractPrNumber(link: string): string | undefined {
  // Match GitHub PR links or Graphite PR links
  const match = link.match(/(?:\/pull\/|\/github\/pr\/Uniswap\/universe\/)(\d+)/)

  return match?.[1]
}

function findCommitForPr(prNumber: string): string | undefined {
  // Use git log to search for the PR number in all commit messages
  const log = execSync(`git log --oneline --all --grep="(#${prNumber})"`).toString().split('\n').filter(Boolean)
  if (log.length === 0) return undefined
  // Return the oldest (last) result
  const lastLine = log[log.length - 1]
  const [hash] = lastLine?.split(' ') ?? []

  return hash
}

interface FoundPR {
  prNumber: string
  hash: string
}

interface NotFoundPR {
  prNumber: string
  link: string
}

async function main(): Promise<void> {
  console.log('\nCherry-pick command generator for Release Management\n')
  console.log(
    'This script interactively prompts for a list of GitHub PR links, extracts PR numbers, searches recent git commits for each PR, and outputs the mapping, missing PRs, and a cherry-pick command for found commits.\n',
  )
  console.log(
    'To get the GitHub or Graphite links, reference the Cherry Pick Database in Notion for the release you are targeting. Select the cells from the `PR Links` column, copy them, and paste the result into the prompt below.',
  )
  console.log('---------------------------------------------------')
  const { prLinksRaw } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'prLinksRaw',
      message: 'Paste your PR links (one per line or comma-separated):',
    },
  ])

  // Split by newlines or commas, trim, and filter out empty lines
  const prLinks: string[] = prLinksRaw
    .split(/\n|,/)
    .map((s: string) => s.trim())
    .filter(Boolean)

  if (prLinks.length === 0) {
    console.error('No PR links provided. Exiting.')
    process.exit(1)
  }

  const prNumbers = prLinks.map(extractPrNumber)
  const prMap = prLinks.map((link, i) => ({
    link,
    prNumber: prNumbers[i],
  }))

  const found: FoundPR[] = []
  const notFound: NotFoundPR[] = []

  for (const prInfo of prMap) {
    const link = prInfo.link
    const prNumber = prInfo.prNumber

    if (!prNumber) {
      notFound.push({ prNumber: 'N/A', link })
      continue
    }
    const hash = findCommitForPr(prNumber)
    if (hash) {
      found.push({ prNumber, hash })
    } else {
      notFound.push({ prNumber, link })
    }
  }

  console.log('\n=== PRs and their commit hashes ===')
  found.forEach((item) => {
    const link = prMap.find((pr) => pr.prNumber === item.prNumber)?.link || ''
    console.log('PR #' + item.prNumber + ': ' + item.hash + ' ' + link)
  })

  if (notFound.length > 0) {
    console.log('\n=== PRs NOT FOUND in recent commits ===')
    notFound.forEach((item) => {
      console.log('PR #' + item.prNumber + ': ' + item.link)
    })
  }

  if (found.length > 0) {
    const hashes = found.map((f) => f.hash).join(' ')
    const cherryPickCommand = 'git cherry-pick ' + hashes
    console.log('\nCherry-pick command:')
    console.log(cherryPickCommand)

    // Prompt user for action
    const { action } = await inquirer.prompt([
      {
        type: 'input',
        name: 'action',
        message: 'Press "c" to copy, "r" to copy and run, or any other key to exit:',
        default: 'e',
      },
    ])

    // If user presses enter (empty string), copy and run
    if (action.toLowerCase() === 'r') {
      await clipboardy.write(cherryPickCommand)
      console.log('Copied to clipboard! Running command...')
      try {
        execSync(cherryPickCommand, { stdio: 'inherit' })
      } catch (err) {
        console.error('Error running cherry-pick command:', err)
      }
    } else if (action.toLowerCase() === 'c') {
      await clipboardy.write(cherryPickCommand)
      console.log('Copied to clipboard!')
    } else {
      console.log('Exiting without copying or running the command.')
    }
  } else {
    console.log('\nNo commits found to cherry-pick.')
  }
}

main()
