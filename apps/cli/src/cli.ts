#!/usr/bin/env bun
/* eslint-disable complexity */
import { type CollectOptions } from '@universe/cli/src/core/data-collector'
import { Orchestrator, type OrchestratorConfig, type OutputConfig } from '@universe/cli/src/core/orchestrator'
import { createVercelAIProvider } from '@universe/cli/src/lib/ai-provider-vercel'
import { SqliteCacheProvider } from '@universe/cli/src/lib/cache-provider-sqlite'
import { ConsoleLogger, type Logger } from '@universe/cli/src/lib/logger'
import { parseReleaseIdentifier, ReleaseScanner } from '@universe/cli/src/lib/release-scanner'
import { detectRepository, resolveTeam } from '@universe/cli/src/lib/team-resolver'
import { parseArgs } from 'util'

/* eslint-disable no-console */

// ============================================================================
// CLI Configuration
// ============================================================================

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: Bun.argv,
    options: {
      // UI options
      interactive: { type: 'boolean', default: false, description: 'Force interactive UI mode' },
      ui: { type: 'boolean', default: false, description: 'Force interactive UI mode (alias for --interactive)' },

      // Analysis options
      mode: {
        type: 'string',
        description: 'Analysis mode (team-digest, changelog, release-changelog, bug-bisect, etc.)',
      },
      prompt: { type: 'string', description: 'Custom prompt (file path or inline text)' },
      bug: { type: 'string', description: 'Bug description for bug-bisect mode (requires --release)' },

      // Data filtering
      team: { type: 'string', description: 'Team filter (@org/team or user1,user2)' },
      since: { type: 'string', default: '30 days ago', description: 'Time period to analyze' },
      repo: { type: 'string', description: 'Repository (owner/name)' },
      'include-open-prs': { type: 'boolean', default: false, description: 'Include open PRs' },

      // Release options
      release: { type: 'string', description: 'Release to analyze (e.g., mobile/1.60 or extension/1.30.0)' },
      'compare-with': { type: 'string', description: 'Specific version to compare with' },
      'list-releases': { type: 'boolean', default: false, description: 'List available releases' },
      platform: { type: 'string', description: 'Platform filter (mobile or extension)' },

      // Commit data options
      'include-diffs': { type: 'boolean', default: false, description: 'Include actual diff content in commits' },
      'max-diff-size': { type: 'string', default: '100', description: 'Max lines changed per file to include diff' },
      'max-diff-files': { type: 'string', default: '20', description: 'Max number of files to include diffs for' },
      'diff-pattern': { type: 'string', description: 'Regex pattern for files to include diffs' },
      'exclude-test-diffs': { type: 'boolean', default: true, description: 'Exclude test files from diffs' },
      'token-budget': { type: 'string', default: '50000', description: 'Approximate token budget for commit data' },
      'pr-body-limit': { type: 'string', default: '2000', description: 'Max characters for PR body' },
      'save-artifacts': { type: 'boolean', default: false, description: 'Save analysis artifacts for debugging' },

      // Output options
      output: { type: 'string', multiple: true, description: 'Output targets (can specify multiple)' },

      // Other options
      verbose: { type: 'boolean', default: false, description: 'Verbose logging' },
      'dry-run': { type: 'boolean', default: false, description: 'Test mode without publishing' },
      'no-cache': { type: 'boolean', default: false, description: 'Bypass cache and fetch fresh data' },
      'force-refresh': {
        type: 'boolean',
        default: false,
        description: 'Bypass cache and fetch fresh data (alias for --no-cache)',
      },
      help: { type: 'boolean', default: false, description: 'Show help' },
    },
    strict: true,
    allowPositionals: true,
  })

  if (values.help) {
    showHelp()
    process.exit(0)
  }

  // Detect if we should use UI mode
  const shouldUseUI =
    values.interactive ||
    values.ui ||
    (!values.release &&
      !values.mode &&
      !values.prompt &&
      !values.team &&
      !values['list-releases'] &&
      !values.output &&
      positionals.length === 0)

  if (shouldUseUI) {
    throw new Error('UI mode is not supported')
  }

  try {
    // Create logger early for consistent logging
    const logger = new ConsoleLogger(values.verbose || false)

    // Handle --list-releases
    if (values['list-releases']) {
      const scanner = new ReleaseScanner(process.cwd(), logger)
      const platform = values.platform as 'mobile' | 'extension' | undefined
      await scanner.listReleases(platform)
      process.exit(0)
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.error('Error: ANTHROPIC_API_KEY environment variable is required')
      logger.error('Get your API key from: https://console.anthropic.com/')
      process.exit(1)
    }

    // Build configuration
    const config = await buildConfig(values, logger)

    if (values.verbose) {
      logger.debug(`Configuration: ${JSON.stringify(config, null, 2)}`)
    }

    // Create cache provider (unless bypassing cache)
    const bypassCache = values['no-cache'] || values['force-refresh']
    const cacheProvider = bypassCache ? undefined : new SqliteCacheProvider()

    // Run orchestrator
    const aiProvider = createVercelAIProvider(process.env.ANTHROPIC_API_KEY)
    const orchestrator = new Orchestrator({
      config,
      aiProvider,
      cacheProvider,
      logger,
    })
    await orchestrator.execute()

    // Close cache connection if used
    if (cacheProvider) {
      cacheProvider.close()
    }

    logger.info('✨ Analysis complete!')
  } catch (error) {
    // Create a minimal logger if we don't have one yet
    const errorLogger = new ConsoleLogger(false)
    errorLogger.error(`Fatal error: ${error}`)
    process.exit(1)
  }
}

interface BuildConfigArgs {
  repo?: string
  team?: string
  since?: string
  'include-open-prs'?: boolean
  release?: string
  'compare-with'?: string
  mode?: string
  prompt?: string
  bug?: string
  'include-diffs'?: boolean
  'max-diff-size'?: string
  'max-diff-files'?: string
  'diff-pattern'?: string
  'exclude-test-diffs'?: boolean
  'token-budget'?: string
  'pr-body-limit'?: string
  output?: string[]
  verbose?: boolean
  'dry-run'?: boolean
  'save-artifacts'?: boolean
  'no-cache'?: boolean
  'force-refresh'?: boolean
}

async function buildConfig(args: BuildConfigArgs, logger: Logger): Promise<OrchestratorConfig> {
  // Parse repository
  let repository: { owner?: string; name?: string } | undefined

  if (args.repo) {
    const match = args.repo.match(/^([^/]+)\/([^/]+)$/)
    if (!match) {
      throw new Error(`Invalid repository format: "${args.repo}". Expected: owner/repo`)
    }
    repository = { owner: match[1], name: match[2] }
  } else {
    // Try to detect from git
    repository = (await detectRepository()) || undefined
  }

  if (repository) {
    logger.info(`Repository: ${repository.owner}/${repository.name}`)
  }

  // Resolve team if specified
  let teamFilter: string[] | undefined
  let teamUsernames: string[] | undefined

  if (args.team) {
    logger.info(`Resolving team: ${args.team}`)
    const resolution = await resolveTeam(args.team)
    teamFilter = resolution.emails
    teamUsernames = resolution.usernames

    if (teamFilter.length === 0) {
      throw new Error('Failed to resolve team filter')
    }
    logger.info(`Team resolved to ${teamFilter.length} email(s)`)
    if (args.verbose) {
      logger.debug(`Emails: ${teamFilter}`)
      logger.debug(`Usernames: ${teamUsernames}`)
    }
  }

  // Parse outputs
  const outputs = parseOutputs(args.output || ['stdout'])

  // Handle release mode
  let releaseOptions
  if (args.release) {
    const releaseId = parseReleaseIdentifier(args.release)
    if (!releaseId) {
      throw new Error(`Invalid release format: "${args.release}". Expected: mobile/1.60 or extension/1.30.0`)
    }

    let version = releaseId.version

    // Handle "latest" keyword
    if (version === 'latest') {
      const scanner = new ReleaseScanner(process.cwd(), logger)
      const latestRelease = await scanner.getLatestRelease(releaseId.platform)

      if (!latestRelease) {
        throw new Error(`No releases found for platform: ${releaseId.platform}`)
      }

      version = latestRelease.version
      logger.info(`Using latest ${releaseId.platform} release: ${version}`)
    }

    releaseOptions = {
      platform: releaseId.platform,
      version,
      compareWith: args['compare-with'],
    }

    // Auto-set mode to release-changelog if not explicitly set
    if (!args.mode) {
      args.mode = 'release-changelog'
    }
  }

  // Build commit data config
  const commitDataConfig = {
    includeFilePaths: true, // Always include file paths
    includeDiffs: args['include-diffs'],
    maxDiffSize: parseInt(args['max-diff-size'] || '100', 10),
    maxDiffFiles: parseInt(args['max-diff-files'] || '20', 10),
    diffFilePattern: args['diff-pattern'],
    excludeTestFiles: args['exclude-test-diffs'] !== false,
    tokenBudget: parseInt(args['token-budget'] || '50000', 10),
    prBodyLimit: parseInt(args['pr-body-limit'] || '2000', 10),
  }

  // Build collection options
  const collectOptions: CollectOptions = {
    since: args.since ?? '30 days ago',
    repository,
    teamFilter,
    teamUsernames,
    includeOpenPrs: args['include-open-prs'],
    commitDataConfig,
  }

  // Handle bug-bisect mode
  if (args.bug) {
    if (!args.release) {
      throw new Error('--bug requires --release to be specified')
    }
    // Auto-set mode to bug-bisect if not explicitly set
    if (!args.mode) {
      args.mode = 'bug-bisect'
    } else if (args.mode !== 'bug-bisect') {
      throw new Error('--bug can only be used with --mode bug-bisect')
    }
  }

  // Build analysis config
  const analysisConfig = {
    mode: args.mode,
    prompt: args.prompt,
    releaseOptions,
    variables: args.bug
      ? {
          BUG_DESCRIPTION: args.bug,
        }
      : undefined,
  }

  return {
    analysis: analysisConfig,
    outputs,
    collect: collectOptions,
    verbose: args.verbose,
    dryRun: args['dry-run'],
    saveArtifacts: args['save-artifacts'],
    bypassCache: args['no-cache'] || args['force-refresh'] || false,
  }
}

function parseOutputs(outputs: string[]): OutputConfig[] {
  return outputs.map((output) => {
    // Parse format: type:target
    // Examples:
    //   stdout
    //   file:report.md
    //   slack:#channel
    //   github-release

    const parts = output.split(':')
    const type = parts[0]
    const target = parts.slice(1).join(':') // Handle colons in target

    if (!type) {
      throw new Error(`Invalid output format: "${output}"`)
    }

    return {
      type,
      target: target || undefined,
    }
  })
}

function showHelp(): void {
  console.log(`
Repository Intelligence System - Analyze git history with AI

Usage: bun scripts/gh-agent-refactored.ts [options]

ANALYSIS OPTIONS:
  --mode <mode>           Predefined analysis mode (team-digest, changelog, release-changelog, bug-bisect)
  --prompt <prompt>       Custom prompt (file path or inline text)
                          Examples:
                            --prompt ./my-analysis.md
                            --prompt "Analyze for security issues"
  --bug <description>     Bug description for bug-bisect mode (requires --release)
                          Example:
                            --bug "Users can't connect wallet on mobile app"
                            --release mobile/1.60 --bug "Crash on launch"

DATA FILTERING:
  --team <team>           Team filter (@org/team or user1,user2)
                          Examples:
                            --team @Uniswap/apps-swap
                            --team alice,bob
                            --team @Uniswap/backend,external-contributor
  --since <period>        Time period to analyze (default: "30 days ago")
  --repo <owner/name>     Repository to analyze (auto-detected if not specified)
  --include-open-prs      Include open/in-review PRs in analysis

RELEASE OPTIONS:
  --release <id>          Release to analyze (e.g., mobile/1.60, extension/1.30.0, or mobile/latest)
  --compare-with <ver>    Specific version to compare with (auto-detects if not specified)
  --list-releases         List available releases
  --platform <name>       Platform filter for --list-releases (mobile or extension)

OUTPUT OPTIONS:
  --output <target>       Output target (can specify multiple)
                          Examples:
                            --output stdout (default)
                            --output file:report.md
                            --output slack:#channel
                          Multiple outputs:
                            --output file:report.md --output slack:#updates

OTHER OPTIONS:
  --verbose               Enable verbose logging
  --dry-run               Test mode without publishing
  --no-cache              Bypass cache and fetch fresh data
  --force-refresh         Bypass cache and fetch fresh data (alias for --no-cache)
  --help                  Show this help message

EXAMPLES:
  # Team digest with default settings
  bun scripts/gh-agent-refactored.ts --mode team-digest --team @Uniswap/apps-swap

  # Weekly changelog
  bun scripts/gh-agent-refactored.ts --mode changelog --since "1 week ago"

  # Release changelog for mobile
  bun scripts/gh-agent-refactored.ts --release mobile/1.60

  # Release changelog for latest mobile release
  bun scripts/gh-agent-refactored.ts --release mobile/latest

  # Release changelog with specific comparison
  bun scripts/gh-agent-refactored.ts --release mobile/1.60 --compare-with mobile/1.58

  # Bug bisect - find which commit introduced a bug
  bun scripts/gh-agent-refactored.ts --release mobile/1.60 --bug "Users can't connect wallet"

  # List all releases
  bun scripts/gh-agent-refactored.ts --list-releases

  # List mobile releases only
  bun scripts/gh-agent-refactored.ts --list-releases --platform mobile

  # Custom analysis with multiple outputs
  bun scripts/gh-agent-refactored.ts \\
    --prompt "Analyze for performance improvements" \\
    --team alice,bob \\
    --output file:performance.md \\
    --output slack:#perf-updates

ENVIRONMENT VARIABLES:
  ANTHROPIC_API_KEY       Required - Your Anthropic API key
  SLACK_WEBHOOK           Optional - Webhook URL for Slack integration

For more information, see the documentation at:
https://github.com/Uniswap/universe/scripts/gh-agent/README.md
`)
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}
