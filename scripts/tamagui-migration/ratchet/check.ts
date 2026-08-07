/**
 * Converted-directory ratchet (INFRA-2957): once a directory is listed in
 * ratchet.json, PRs must not reintroduce `ui/src` or `tamagui` imports there.
 * Pure logic lives here so dangerfile.ts stays a thin caller.
 */

export interface RatchetConfig {
  convertedDirectories: string[]
}

const RATCHET_PATH = 'scripts/tamagui-migration/ratchet/ratchet.json'

// Same string probes the dangerfile tamagui check uses on added lines
const BANNED_IMPORT_PROBES = [`from 'ui/src`, `from 'tamagui`] as const

export function parseRatchetConfig(raw: string): RatchetConfig {
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null || !('convertedDirectories' in parsed)) {
    throw new Error(`${RATCHET_PATH} must contain a "convertedDirectories" array`)
  }
  const directories = (parsed as Record<string, unknown>)['convertedDirectories']
  if (!Array.isArray(directories)) {
    throw new Error(`${RATCHET_PATH}: "convertedDirectories" must be an array`)
  }
  for (const directory of directories) {
    if (typeof directory !== 'string' || directory.length === 0) {
      throw new Error(`${RATCHET_PATH}: entries must be non-empty strings, got ${JSON.stringify(directory)}`)
    }
    if (directory.startsWith('/') || directory.endsWith('/')) {
      throw new Error(`${RATCHET_PATH}: entries must be repo-relative with no trailing slash, got "${directory}"`)
    }
  }
  return { convertedDirectories: directories as string[] }
}

export function findRatchetViolations({
  filePath,
  addedLines,
  convertedDirectories,
}: {
  filePath: string
  addedLines: string[]
  convertedDirectories: string[]
}): string[] {
  const convertedDirectory = convertedDirectories.find(
    (directory) => filePath === directory || filePath.startsWith(`${directory}/`),
  )
  if (!convertedDirectory) {
    return []
  }

  const violations: string[] = []
  for (const line of addedLines) {
    if (BANNED_IMPORT_PROBES.some((probe) => line.includes(probe))) {
      violations.push(
        `\`${filePath}\` is inside \`${convertedDirectory}\`, which is already converted off Tamagui (see \`${RATCHET_PATH}\`). ` +
          `Import from \`@universe/mycelium\` instead — found: \`${line.trim()}\``,
      )
    }
  }
  return violations
}
