import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import * as sendCallsModule from '@universe/embedded-wallet/src/connection/sendCalls'
import * as userOpSigningModule from '@universe/embedded-wallet/src/connection/userOpSigning'
import {
  type CoverageRow,
  NON_SIGNING_MODULES,
  PROVIDER_METHOD_COVERAGE,
  SIGNING_MODULE_COVERAGE,
} from '@universe/embedded-wallet/src/e2eCoverage/e2eCoverageManifest'
import * as delegationModule from '@universe/embedded-wallet/src/features/passkey/embeddedWalletDelegation'
import * as signingModule from '@universe/embedded-wallet/src/features/passkey/signing'

const PACKAGE_SRC = resolve(__dirname, '..')
const REPO_ROOT = resolve(PACKAGE_SRC, '../../..')
const PROVIDER_SOURCE = join(PACKAGE_SRC, 'connection/EmbeddedWalletProvider.ts')
/** Directories whose every module must be classified as signing or non-signing in the manifest. */
const SIGNING_DIRECTORIES = ['connection', 'features/passkey']
/** A spec drives the embedded wallet only if it sets the harness up, not merely imports the module. */
const EW_FIXTURE_CALL = 'setupEmbeddedWallet('
const PLATFORM_SUFFIX = /\.(web|native|ios|android)$/

/** Runtime view of each signing module, for enumerating exports. Keys mirror SIGNING_MODULE_COVERAGE. */
const SIGNING_MODULES: Record<string, Record<string, unknown>> = {
  'features/passkey/signing': signingModule,
  'features/passkey/embeddedWalletDelegation': delegationModule,
  'connection/userOpSigning': userOpSigningModule,
  'connection/sendCalls': sendCallsModule,
}

/** Module ids (`connection/sendCalls`) for every non-test source file under the signing directories. */
function listSourceModules(): string[] {
  const modules = new Set<string>()
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name !== 'hooks') {
          walk(join(dir, entry.name))
        }
        continue
      }
      if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts') || entry.name.endsWith('.d.ts')) {
        continue
      }
      const id = relative(PACKAGE_SRC, join(dir, entry.name)).slice(0, -'.ts'.length).replace(PLATFORM_SUFFIX, '')
      modules.add(id)
    }
  }
  for (const directory of SIGNING_DIRECTORIES) {
    walk(join(PACKAGE_SRC, directory))
  }
  return [...modules].sort()
}

/** Blanks comments and string contents, keeping offsets, so their braces and `case` are not read as syntax. */
function blankCommentsAndStrings(source: string): string {
  return source.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g,
    (match) =>
      match.startsWith('/') ? ' '.repeat(match.length) : `${match[0]}${' '.repeat(match.length - 2)}${match[0]}`,
  )
}

/** Offsets of the `EmbeddedWalletProvider.request` body, found by brace matching on the blanked source. */
function requestBodySpan(blanked: string): [number, number] {
  const start = blanked.indexOf('async request(')
  const open = blanked.indexOf('{', start)
  let depth = 0
  for (let end = open; end < blanked.length; end++) {
    if (blanked[end] === '{') {
      depth++
    } else if (blanked[end] === '}' && --depth === 0) {
      return [open, end]
    }
  }
  throw new Error('EmbeddedWalletProvider.request has unbalanced braces')
}

/** Every `case` label in `request`; a label that is not a single-quoted method name counts as non-literal. */
function routedProviderMethods(): { methods: string[]; nonLiteralCases: number } {
  const source = readFileSync(PROVIDER_SOURCE, 'utf8')
  const blanked = blankCommentsAndStrings(source)
  const [start, end] = requestBodySpan(blanked)
  const methods = [...source.slice(start, end).matchAll(/\bcase '([A-Za-z0-9_]+)':/g)].map((match) => match[1] ?? '')
  const caseCount = [...blanked.slice(start, end).matchAll(/\bcase\b/g)].length
  return { methods, nonLiteralCases: caseCount - methods.length }
}

function allRows(): { location: string; row: CoverageRow }[] {
  return [
    ...Object.entries(PROVIDER_METHOD_COVERAGE).map(([method, row]) => ({ location: `provider ${method}`, row })),
    ...Object.entries(SIGNING_MODULE_COVERAGE).flatMap(([modulePath, rows]) =>
      Object.entries(rows).map(([fn, row]) => ({ location: `${modulePath}#${fn}`, row })),
    ),
  ]
}

describe('embedded wallet e2e coverage manifest', () => {
  it('has a row for every method EmbeddedWalletProvider routes, and no stale rows', () => {
    const { methods, nonLiteralCases } = routedProviderMethods()
    expect(methods.length).toBeGreaterThan(0)
    expect(
      nonLiteralCases,
      'every case in EmbeddedWalletProvider.request must be a single-quoted method name so it can be enumerated here',
    ).toBe(0)
    const rows = Object.keys(PROVIDER_METHOD_COVERAGE)
    expect(
      methods.filter((method) => !rows.includes(method)),
      'provider methods with no row: add { coveredBy: [spec] } or { exempt: reason } to PROVIDER_METHOD_COVERAGE',
    ).toEqual([])
    expect(
      rows.filter((method) => !methods.includes(method)),
      'stale PROVIDER_METHOD_COVERAGE rows: the provider no longer routes these methods',
    ).toEqual([])
  })

  it('classifies every module under the signing directories as signing or non-signing', () => {
    const listed = listSourceModules()
    const signing = Object.keys(SIGNING_MODULE_COVERAGE)
    const nonSigning = Object.keys(NON_SIGNING_MODULES)
    expect(
      listed.filter((id) => !signing.includes(id) && !nonSigning.includes(id)),
      'unclassified modules: add a row per export under SIGNING_MODULE_COVERAGE, or a reason under NON_SIGNING_MODULES',
    ).toEqual([])
    expect(
      [...signing, ...nonSigning].filter((id) => !listed.includes(id)),
      'stale manifest entries: these modules no longer exist',
    ).toEqual([])
    expect(
      signing.filter((id) => nonSigning.includes(id)),
      'a module cannot be both a signing module and a non-signing module',
    ).toEqual([])
    expect(
      Object.entries(NON_SIGNING_MODULES)
        .filter(([, reason]) => reason.trim().length === 0)
        .map(([id]) => id),
      'non-signing modules need a reason',
    ).toEqual([])
  })

  it('enumerates the same signing modules the manifest covers', () => {
    expect(Object.keys(SIGNING_MODULES).sort()).toEqual(Object.keys(SIGNING_MODULE_COVERAGE).sort())
  })

  it.each(Object.keys(SIGNING_MODULES))('has a row for every runtime export of %s, and no stale rows', (modulePath) => {
    const exported = Object.keys(SIGNING_MODULES[modulePath] ?? {})
    expect(exported.length).toBeGreaterThan(0)
    expect([...exported].sort()).toEqual(Object.keys(SIGNING_MODULE_COVERAGE[modulePath] ?? {}).sort())
  })

  it('names an existing spec that sets up the embedded wallet in every coveredBy row', () => {
    const specSource = new Map<string, string | undefined>()
    const readSpec = (spec: string): string | undefined => {
      if (!specSource.has(spec)) {
        const specPath = join(REPO_ROOT, spec)
        specSource.set(spec, existsSync(specPath) ? readFileSync(specPath, 'utf8') : undefined)
      }
      return specSource.get(spec)
    }
    const problems: string[] = []
    for (const { location, row } of allRows()) {
      if (!row.coveredBy) {
        continue
      }
      if (row.coveredBy.length === 0) {
        problems.push(`${location}: coveredBy is empty`)
      }
      for (const spec of row.coveredBy) {
        const source = readSpec(spec)
        if (!spec.endsWith('.e2e.test.ts')) {
          problems.push(`${location}: ${spec} is not a Playwright e2e spec`)
        } else if (source === undefined) {
          problems.push(`${location}: ${spec} does not exist`)
        } else if (!source.includes(EW_FIXTURE_CALL)) {
          problems.push(
            `${location}: ${spec} never calls setupEmbeddedWallet, so it does not drive the embedded wallet`,
          )
        }
      }
    }
    expect(problems).toEqual([])
  })

  it('gives every exemption a reason', () => {
    const missing = allRows()
      .filter(({ row }) => row.exempt !== undefined && row.exempt.trim().length === 0)
      .map(({ location }) => location)
    expect(missing).toEqual([])
  })
})
