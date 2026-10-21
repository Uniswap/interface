/* oxlint-disable no-control-regex */
/**
 * Log parsing utilities for CI failures analysis
 *
 * Extracts failure information from GitHub Actions log output.
 *
 * GitHub Actions logs are structured with ##[group]/##[endgroup] markers
 * around each step. We use this structure to extract the right content
 * rather than pattern-matching error strings.
 */

// ANSI escape code pattern - using escape character code point
// oxlint-disable-next-line no-control-regex -- it's ok to use escape character code point
const ANSI_ESCAPE_PATTERN = /\u001b\[[0-9;]*[a-zA-Z]/g

/**
 * Clean a log line - remove timestamp prefix and ANSI codes
 */
function cleanLogLine(line: string): string {
  return (
    line
      // Remove timestamp prefix (2025-12-09T21:13:22.1872348Z)
      .replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*/, '')
      // Remove ANSI escape codes
      .replace(ANSI_ESCAPE_PATTERN, '')
      .trimEnd()
  )
}

// ── Step section extraction ──────────────────────────────────────

interface StepSection {
  /** The step name from the ##[group] header */
  name: string
  /** The content lines between ##[group] and ##[endgroup] */
  content: string[]
  /** Whether this section contains a ##[error] marker */
  hasError: boolean
}

/**
 * Parse a GH Actions log into step sections.
 * Each section is delimited by ##[group]...##[endgroup].
 */
function parseStepSections(logs: string): StepSection[] {
  const lines = logs.split('\n')
  const sections: StepSection[] = []
  let current: StepSection | null = null

  for (const [lineIdx, line] of lines.entries()) {
    const cleaned = cleanLogLine(line)

    if (cleaned.startsWith('##[group]')) {
      // Save previous section
      if (current) {
        sections.push(current)
      }
      // Start new section — extract step name from the group header
      const name = cleaned.replace('##[group]', '').trim()
      current = { name, content: [], hasError: false }
      continue
    }

    if (cleaned.startsWith('##[endgroup]')) {
      if (current) {
        sections.push(current)
        current = null
      }
      continue
    }

    if (current) {
      if (cleaned.includes('##[error]')) {
        current.hasError = true
      }
      if (cleaned) {
        current.content.push(cleaned)
      }
    } else if (cleaned.includes('##[error]')) {
      // Error outside any group — capture ALL content between last ##[endgroup] and here
      const tail: string[] = []
      for (let j = lineIdx; j >= 0; j--) {
        const cl = cleanLogLine(lines[j] ?? '')
        if (!cl) {
          continue
        }
        // Stop at the previous group boundary
        if (cl.startsWith('##[endgroup]') || cl.startsWith('##[group]')) {
          break
        }
        // Skip ##[error] and other markers
        if (cl.startsWith('##[')) {
          continue
        }
        tail.unshift(cl)
      }
      if (tail.length > 0) {
        sections.push({ name: '(ungrouped)', content: tail, hasError: true })
      }
    }
  }

  // Don't forget the last section if we're still in one
  if (current) {
    sections.push(current)
  }

  return sections
}

/**
 * Extract the failed step's content from a log.
 *
 * GH Actions logs have two patterns:
 * 1. Error inside a ##[group]: the step itself logged ##[error]
 * 2. Error outside any group: the command ran between ##[endgroup] and ##[error],
 *    with its stdout ungrouped. This is common for shell steps like `bunx nx sync:check`.
 *
 * For case 2, we capture all ungrouped content between the last ##[endgroup]
 * and the ##[error] — that's the actual command output.
 */
function extractFailedStepContent(logs: string): string | null {
  const sections = parseStepSections(logs)

  // Find ANY section with errors (including ungrouped)
  const errorSections = sections.filter((s) => s.hasError && s.content.length > 0)
  if (errorSections.length > 0) {
    const section = errorSections[errorSections.length - 1]
    if (section) {
      return section.content.join('\n')
    }
  }

  // No error sections — return last non-empty section
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i]
    if (section && section.content.length > 0) {
      return section.content.join('\n')
    }
  }

  return null
}

// ── Vitest/Jest extraction ──────────────────────────────────────

const isFailedTestsHeader = (line: string): boolean => line.includes('Failed Tests') && line.includes('⎯')
const isTestFailMarker = (line: string): boolean =>
  line.includes(' FAIL ') && !line.includes('Snapshots') && !line.includes('Test Files')
const isSectionSeparator = (line: string): boolean => line.includes('⎯⎯⎯') && /\[\d+\/\d+\]/.test(line)
const isSummaryLine = (line: string): boolean =>
  line.startsWith('Snapshots') ||
  line.startsWith('Test Files') ||
  line.startsWith('Tests') ||
  line.startsWith('Start at') ||
  line.startsWith('Duration')

function formatFailedSection(testIdentifier: string, content: string[]): string {
  return `### Failed: ${testIdentifier}\n${content.join('\n')}`
}

function extractVitestSummary(logs: string): string | null {
  const lines = logs.split('\n')
  for (const line of lines) {
    const cleaned = cleanLogLine(line).trim()
    if (cleaned.startsWith('Tests') && cleaned.includes('failed') && cleaned.includes('passed')) {
      return cleaned
    }
  }
  return null
}

/**
 * Extract vitest/jest test failures from logs
 */
function extractVitestFailures(logs: string): string {
  const lines = logs.split('\n')
  const failedSections: string[] = []
  let inFailedTestsSection = false
  let currentSection: string[] = []
  let testIdentifier = ''

  const saveCurrentSection = (): void => {
    if (currentSection.length > 0 && testIdentifier) {
      failedSections.push(formatFailedSection(testIdentifier, currentSection))
    }
    currentSection = []
    testIdentifier = ''
  }

  for (const line of lines) {
    const cleaned = cleanLogLine(line)
    if (isFailedTestsHeader(cleaned)) {
      inFailedTestsSection = true
      continue
    }
    if (!inFailedTestsSection) {
      continue
    }
    if (isTestFailMarker(cleaned)) {
      saveCurrentSection()
      const failMatch = cleaned.match(/FAIL\s+(.+)/)
      testIdentifier = failMatch?.[1]?.trim() ?? 'unknown test'
      continue
    }
    if (isSectionSeparator(cleaned)) {
      saveCurrentSection()
      continue
    }
    if (isSummaryLine(cleaned)) {
      saveCurrentSection()
      break
    }
    if (testIdentifier && cleaned) {
      currentSection.push(cleaned)
    }
  }
  saveCurrentSection()

  if (failedSections.length === 0) {
    return ''
  }
  const summary = extractVitestSummary(logs)
  const result = failedSections.join('\n\n---\n\n')
  return summary ? `${result}\n\n**Summary:** ${summary}` : result
}

// ── NX task extraction ──────────────────────────────────────────

/**
 * Extract failing NX task sections from logs.
 *
 * Strategy (in priority order):
 * 1. Look for ##[group]❌ markers (NX failed task sections)
 * 2. Look for vitest/jest failure sections
 * 3. Structurally extract the failed step's content using ##[group]/##[endgroup] boundaries
 */
export function extractFailingNxTasks(logs: string): string {
  const lines = logs.split('\n')
  const failedSections: string[] = []
  let inFailedTask = false
  let currentSection: string[] = []
  let taskName = ''

  for (const line of lines) {
    if (line.includes('##[group]❌') && line.includes('nx run')) {
      inFailedTask = true
      const match = line.match(/nx run ([^"\s]+)/)
      taskName = match?.[1] ?? 'unknown task'
      currentSection = [`### Failed: ${taskName}`]
      continue
    }
    if (
      inFailedTask &&
      (line.includes('::endgroup::') || line.includes('##[endgroup]') || line.includes('##[group]'))
    ) {
      if (currentSection.length > 1) {
        failedSections.push(currentSection.join('\n'))
      }
      inFailedTask = false
      currentSection = []
      taskName = ''
      continue
    }
    if (inFailedTask) {
      const cleaned = cleanLogLine(line)
      if (cleaned) {
        currentSection.push(cleaned)
      }
    }
  }

  if (failedSections.length > 0) {
    return failedSections.join('\n\n---\n\n')
  }

  // Try vitest/jest extraction
  const vitestResult = extractVitestFailures(logs)
  if (vitestResult) {
    return vitestResult
  }

  // Structural fallback: extract the failed step's content
  const stepContent = extractFailedStepContent(logs)
  if (stepContent) {
    return stepContent
  }

  return 'No error details found in logs'
}
