/**
 * Tamagui→Mycelium conversion codemod CLI (INFRA-2957).
 *
 * Dry-run over one or more directories, printing what would convert and what
 * routes to the manual lane (with reasons). Nothing is written without --write.
 *
 *   bun scripts/tamagui-migration/codemod/cli.ts <path...> [--write] [--json]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { runCodemodOnSource, type FlagReason } from './driver'

const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', '.git', 'fixtures', '__generated__'])

interface ManualLaneEntry {
  file: string
  reasons: FlagReason[]
}

function collectSourceFiles(path: string, files: string[] = []): string[] {
  if (statSync(path).isFile()) {
    files.push(path)
    return files
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        collectSourceFiles(join(path, entry.name), files)
      }
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(join(path, entry.name))
    }
  }
  return files
}

function main(argv: string[]): number {
  const write = argv.includes('--write')
  const asJson = argv.includes('--json')
  const paths = argv.filter((arg) => !arg.startsWith('--'))
  if (paths.length === 0) {
    console.error('Usage: bun scripts/tamagui-migration/codemod/cli.ts <path...> [--write] [--json]')
    return 1
  }

  const converted: string[] = []
  const manualLane: ManualLaneEntry[] = []
  let cleanCount = 0

  for (const path of paths) {
    for (const file of collectSourceFiles(path)) {
      const relativePath = relative(process.cwd(), file)
      const result = runCodemodOnSource(readFileSync(file, 'utf8'))
      if (result.status === 'converted') {
        converted.push(relativePath)
        if (write) {
          writeFileSync(file, result.output)
        }
      } else if (result.status === 'flagged') {
        manualLane.push({ file: relativePath, reasons: result.reasons })
      } else {
        cleanCount += 1
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ write, converted, manualLane, cleanCount }, null, 2))
    return 0
  }

  const verb = write ? 'converted' : 'would convert'
  for (const file of converted) {
    console.log(`${verb}  ${file}`)
  }
  for (const entry of manualLane) {
    console.log(`manual    ${entry.file}  (${entry.reasons.join(', ')})`)
  }
  console.log(
    `\n${converted.length} ${verb}, ${manualLane.length} routed to the manual lane, ${cleanCount} clean.${write ? '' : ' Re-run with --write to apply.'}`,
  )
  return 0
}

process.exit(main(process.argv.slice(2)))
