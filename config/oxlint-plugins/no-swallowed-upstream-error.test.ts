/**
 * Run with `bun test config/oxlint-plugins/no-swallowed-upstream-error.test.ts`
 *
 * Drives the real oxlint binary over fixtures through the universe-custom
 * registration, the same wiring CI uses.
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '../..')
const PLUGIN_PATH = join(import.meta.dir, 'universe-custom.js')
const OXLINT_BIN = join(REPO_ROOT, 'node_modules/.bin/oxlint')
const RULE = 'universe-custom/no-swallowed-upstream-error'

let fixtureRoot: string

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'no-swallowed-upstream-error-'))
})

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true })
})

function lint(source: string, fileName = 'createFooService.ts'): string[] {
  const dir = mkdtempSync(join(fixtureRoot, 'case-'))
  const filePath = join(dir, fileName)
  writeFileSync(filePath, source)
  const configPath = join(dir, '.oxlintrc.json')
  writeFileSync(
    configPath,
    JSON.stringify({
      plugins: [],
      categories: { correctness: 'off' },
      jsPlugins: [PLUGIN_PATH],
      rules: { [RULE]: 'error' },
    }),
  )
  const result = Bun.spawnSync([OXLINT_BIN, '-c', configPath, '--format', 'json', filePath], {
    cwd: dir,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(`oxlint exited with ${result.exitCode} (stderr: ${result.stderr.toString()})`)
  }
  const parsed = JSON.parse(result.stdout.toString()) as { diagnostics?: { message: string }[] }
  return (parsed.diagnostics ?? []).map((d) => d.message)
}

describe('no-swallowed-upstream-error', () => {
  test('fires on a catch that folds an awaited upstream failure into an empty result', () => {
    const messages = lint(`
export async function listSecrets(client: { list: () => Promise<string[]> }) {
  try {
    return await client.list()
  } catch (err) {
    if (/ECONNREFUSED|route.*not found/i.test(String(err))) {
      return []
    }
    throw err
  }
}
`)
    expect(messages.some((m) => m.includes('may only return under'))).toBe(true)
    expect(messages.some((m) => m.includes('Do not classify an upstream error from its message'))).toBe(true)
  })

  test('allows a return guarded by isRpcNotFound', () => {
    expect(
      lint(`
import { isRpcNotFound } from '@universe/api'
export async function getProposal(client: { get: () => Promise<string> }) {
  try {
    return await client.get()
  } catch (err) {
    if (isRpcNotFound(err)) {
      return null
    }
    throw err
  }
}
`),
    ).toEqual([])
  })

  test('ignores a parse guard with no await and a bare return', () => {
    expect(
      lint(`
export function parseLink(link: string): URL | null {
  try {
    return new URL(link)
  } catch {
    return null
  }
}
export async function post(run: () => Promise<void>, fail: (e: unknown) => void) {
  try {
    await run()
  } catch (err) {
    fail(err)
    return
  }
}
`),
    ).toEqual([])
  })

  test('skips test files', () => {
    expect(
      lint(
        `
export async function f(run: () => Promise<string>) {
  try { return await run() } catch { return null }
}
`,
        'createFooService.test.ts',
      ),
    ).toEqual([])
  })
})
