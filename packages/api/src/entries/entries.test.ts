// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Subpath entries exist so web apps can import API clients without the root barrel's graph.
// Walk each entry's runtime imports (type-only imports are erased) across workspace packages,
// resolving platform-split modules to their web legs like the apps' Vite configs do, and fail
// if the walk reaches a heavyweight dependency or the root barrel.
const PKG_ROOT = join(__dirname, '../..')
const REPO_ROOT = join(PKG_ROOT, '../..')
const FORBIDDEN_PACKAGE =
  /^(@apollo\/|ethers$|ethers\/|@ethersproject\/|react-native$|react-native\/|react-native-|@react-native|redux$|redux-|@reduxjs\/|react-redux$|i18next|react-i18next$)/
const FORBIDDEN_FILES = [
  'packages/api/src/index.ts',
  'packages/api/src/clients/graphql/',
  'packages/uniswap/',
  'packages/wallet/',
  'packages/ui/',
]
const WEB_EXTENSIONS = ['.web.ts', '.web.tsx', '.ts', '.tsx']
const IMPORT_PATTERNS = [
  /^(?:import|export)\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]/gm,
  /^import\s+['"]([^'"]+)['"]/gm,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
]

interface WorkspacePackage {
  dir: string
  exports?: Record<string, unknown>
  main?: string
}

const workspacePackages = new Map<string, WorkspacePackage>()
for (const name of readdirSync(join(REPO_ROOT, 'packages'))) {
  const manifest = join(REPO_ROOT, 'packages', name, 'package.json')
  if (existsSync(manifest)) {
    const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as {
      name: string
      exports?: Record<string, unknown>
      main?: string
    }
    workspacePackages.set(pkg.name, { dir: dirname(manifest), exports: pkg.exports, main: pkg.main })
  }
}

function probe(base: string): string | undefined {
  if (existsSync(base) && statSync(base).isFile()) {
    return base
  }
  const candidates = [
    ...WEB_EXTENSIONS.map((ext) => base + ext),
    ...WEB_EXTENSIONS.map((ext) => join(base, `index${ext}`)),
  ]
  return candidates.find((candidate) => existsSync(candidate))
}

function packageName(specifier: string): string {
  const segments = specifier.split('/')
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : (segments[0] ?? specifier)
}

/** Resolves a relative or workspace specifier to a file; undefined means an external package. */
function resolveSpecifier(specifier: string, fromFile: string): string | undefined {
  const path = specifier.split('?')[0] ?? specifier
  if (path.startsWith('.')) {
    return probe(join(dirname(fromFile), path))
  }
  const name = packageName(path)
  const workspace = workspacePackages.get(name)
  if (!workspace) {
    return undefined
  }
  const subpath = path.slice(name.length)
  const exported = workspace.exports?.[`.${subpath}`]
  if (typeof exported === 'string') {
    return probe(join(workspace.dir, exported))
  }
  return probe(join(workspace.dir, subpath === '' ? (workspace.main ?? 'index') : subpath))
}

function runtimeGraph(entry: string): { files: Map<string, string>; external: Map<string, string> } {
  // Each value is the file that first imported the key, to name the culprit on failure.
  const files = new Map<string, string>()
  const external = new Map<string, string>()
  const visit = (file: string, importer: string): void => {
    if (files.has(file)) {
      return
    }
    files.set(file, importer)
    if (!/\.[jt]sx?$/.test(file)) {
      return
    }
    const source = readFileSync(file, 'utf8')
    for (const pattern of IMPORT_PATTERNS) {
      for (const match of source.matchAll(pattern)) {
        const specifier = match[1] ?? ''
        const resolved = resolveSpecifier(specifier, file)
        if (resolved) {
          visit(resolved, file)
        } else if (specifier.startsWith('.') || workspacePackages.has(packageName(specifier))) {
          throw new Error(`cannot resolve ${specifier} from ${file}`)
        } else if (!external.has(specifier)) {
          external.set(specifier, file)
        }
      }
    }
  }
  visit(entry, entry)
  return { files, external }
}

const relative = (file: string): string => file.slice(REPO_ROOT.length + 1)

const { exports: exportsMap } = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')) as {
  exports: Record<string, unknown>
}
const subpathEntries = Object.entries(exportsMap).filter(
  (entry): entry is [string, string] =>
    entry[0] !== '.' && !entry[0].startsWith('./src') && typeof entry[1] === 'string' && entry[1].endsWith('.ts'),
)

describe('subpath entries', () => {
  it('maps every module in src/entries to a subpath', () => {
    const mapped = subpathEntries.map(([, target]) => target)
    for (const file of readdirSync(__dirname).filter((name) => !name.includes('.test.'))) {
      expect(mapped).toContain(`./src/entries/${file}`)
    }
  })

  it.each(subpathEntries)('%s stays off the heavyweight graph', (_subpath, target) => {
    const { files, external } = runtimeGraph(join(PKG_ROOT, target))

    const forbiddenPackages = [...external].filter(([specifier]) => FORBIDDEN_PACKAGE.test(specifier))
    expect(forbiddenPackages.map(([specifier, importer]) => `${specifier} <- ${relative(importer)}`)).toEqual([])

    const forbiddenFiles = [...files].filter(([file]) =>
      FORBIDDEN_FILES.some((prefix) => relative(file).startsWith(prefix)),
    )
    expect(forbiddenFiles.map(([file, importer]) => `${relative(file)} <- ${relative(importer)}`)).toEqual([])
  })
})
