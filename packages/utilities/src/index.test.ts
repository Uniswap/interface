import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC_DIR = __dirname
// Platform variants share their base file's API, so only the base file is cataloged.
const SKIPPED_FILE = /(\.test\.tsx?|\.d\.ts|\.(native|web|ios|android)\.tsx?)$/

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return listSourceFiles(path)
    }
    return /\.tsx?$/.test(entry.name) && !SKIPPED_FILE.test(entry.name) ? [path] : []
  })
}

function toModuleSpecifier(file: string): string {
  const withoutExt = relative(SRC_DIR, file).replace(/\.tsx?$/, '')
  return `utilities/src/${withoutExt}`.replace(/\/index$/, '')
}

const DECLARATION_MODIFIERS = new Set(['declare', 'async', 'abstract'])
const VALUE_KEYWORDS = new Set(['function', 'function*', 'const', 'let', 'var', 'class', 'enum'])

/** Name declared by an `export const|function|class|enum ...` line; undefined for types and re-export lists. */
function getDeclaredExportName(line: string): string | undefined {
  const tokens = line.split(/[\s(<:=]+/)
  if (tokens[0] !== 'export') {
    return undefined
  }
  let i = 1
  while (DECLARATION_MODIFIERS.has(tokens[i] ?? '')) {
    i++
  }
  if (!VALUE_KEYWORDS.has(tokens[i] ?? '')) {
    return undefined
  }
  // `const enum Foo`
  if (tokens[i] === 'const' && tokens[i + 1] === 'enum') {
    i++
  }
  return tokens[i + 1]?.replace(/^\*/, '') || undefined
}

function getRuntimeExportNames(source: string): string[] {
  const names = new Set<string>()
  for (const line of source.split('\n')) {
    const name = getDeclaredExportName(line)
    if (name) {
      names.add(name)
    }
  }
  for (const [, list] of source.matchAll(/^export\s+\{([^}]*)\}/gm)) {
    for (const part of (list as string).split(',')) {
      const entry = part.trim()
      if (entry && !entry.startsWith('type ')) {
        names.add(entry.split(/\s+as\s+/).pop() as string)
      }
    }
  }
  if (/^export\s+default\b/m.test(source)) {
    names.add('default')
  }
  return [...names]
}

function getCatalogedNames(): Map<string, Set<string>> {
  const catalog = readFileSync(join(SRC_DIR, 'index.ts'), 'utf8')
  const bySpecifier = new Map<string, Set<string>>()
  for (const [, list, specifier] of catalog.matchAll(/export\s+\{([^}]*)\}\s+from\s+'([^']+)'/g)) {
    const names = bySpecifier.get(specifier as string) ?? new Set<string>()
    const withoutComments = (list as string).replace(/\/\/.*$/gm, '')
    for (const part of withoutComments.split(',')) {
      const entry = part.trim()
      if (entry) {
        names.add(entry.split(/\s+as\s+/)[0] as string)
      }
    }
    bySpecifier.set(specifier as string, names)
  }
  return bySpecifier
}

describe('utilities catalog (src/index.ts)', () => {
  it('re-exports every runtime export in the package', () => {
    const cataloged = getCatalogedNames()
    const missing = listSourceFiles(SRC_DIR)
      .filter((file) => file !== join(SRC_DIR, 'index.ts'))
      .flatMap((file) => {
        const specifier = toModuleSpecifier(file)
        const listed = cataloged.get(specifier) ?? new Set<string>()
        return getRuntimeExportNames(readFileSync(file, 'utf8'))
          .filter((name) => !listed.has(name))
          .map((name) => `${name} from '${specifier}'`)
      })

    expect(missing, 'Add these to the matching section of packages/utilities/src/index.ts').toEqual([])
  })
})
