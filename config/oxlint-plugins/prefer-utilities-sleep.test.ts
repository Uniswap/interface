/**
 * Run with `bun test config/oxlint-plugins/prefer-utilities-sleep.test.ts`
 *
 * Drives the real oxlint binary over generated fixtures, through the
 * universe-custom.js registration CI uses (there is no ESLint RuleTester here).
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '../..')
const PLUGIN_PATH = join(import.meta.dir, 'universe-custom.js')
const OXLINT_BIN = join(REPO_ROOT, 'node_modules/.bin/oxlint')

interface Diagnostic {
  message: string
}

let fixtureRoot: string

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'prefer-utilities-sleep-'))
})

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true })
})

function lintFixture(source: string, fileName = 'fixture.ts'): Diagnostic[] {
  const dir = mkdtempSync(join(fixtureRoot, 'case-'))
  const filePath = join(dir, ...fileName.split('/'))
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, source)

  const configPath = join(dir, '.oxlintrc.json')
  writeFileSync(
    configPath,
    JSON.stringify({
      plugins: [],
      categories: { correctness: 'off' },
      jsPlugins: [PLUGIN_PATH],
      rules: { 'universe-custom/prefer-utilities-sleep': 'error' },
    }),
  )

  const result = Bun.spawnSync([OXLINT_BIN, '-c', configPath, '--format', 'json', filePath], {
    cwd: dir,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  // 0 = clean, 1 = diagnostics found; anything else means oxlint itself failed
  // (e.g. plugin load error), which would let negative cases pass vacuously.
  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(`oxlint exited with ${result.exitCode} (stderr: ${result.stderr.toString()})`)
  }
  const parsed = JSON.parse(result.stdout.toString()) as { diagnostics?: Diagnostic[] }
  return (parsed.diagnostics ?? []).filter((d) => /hand-roll a delay/.test(d.message))
}

describe('prefer-utilities-sleep', () => {
  test.each([
    ['concise resolve', 'await new Promise((resolve) => setTimeout(resolve, 100))'],
    ['typed promise', 'await new Promise<void>((r) => setTimeout(r, ms))'],
    ['block executor', 'await new Promise((resolve) => { setTimeout(resolve, 100) })'],
    ['callback resolve()', 'await new Promise((resolve) => setTimeout(() => resolve(), 100))'],
    ['callback resolve(undefined)', 'await new Promise((resolve) => setTimeout(() => resolve(undefined), 100))'],
    ['function executor', 'await new Promise(function (resolve) { setTimeout(resolve, 100) })'],
    ['window.setTimeout', 'await new Promise((resolve) => window.setTimeout(resolve, 100))'],
    ['helper definition', 'const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))'],
  ])('fires on %s', (_name, line) => {
    expect(lintFixture(`export async function f(ms: number) {\n  ${line}\n}\n`)).toHaveLength(1)
  })

  test.each([
    [
      'a timeout that stores its timer id',
      'let id; await new Promise((resolve) => { id = setTimeout(resolve, 100) })',
    ],
    [
      'a race that resolves with a computed value',
      'await new Promise((resolve) => setTimeout(() => resolve(compute()), 100))',
    ],
    ['a delayed literal value', 'await new Promise((resolve) => setTimeout(() => resolve(true), 100))'],
    ['a timer that rejects', 'await new Promise((_, reject) => setTimeout(() => reject(new Error("t")), 100))'],
    ['an executor that does more', 'await new Promise((resolve) => { log(); setTimeout(resolve, 100) })'],
    ['a resolve that is not the executor param', 'await new Promise((resolve) => setTimeout(other, 100))'],
    ['setTimeout without a delay', 'await new Promise((resolve) => setTimeout(resolve))'],
  ])('stays silent on %s', (_name, line) => {
    expect(lintFixture(`export async function f() {\n  ${line}\n}\n`)).toHaveLength(0)
  })

  test('stays silent in the module that defines sleep', () => {
    const source = 'export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))\n'
    expect(lintFixture(source, 'packages/utilities/src/time/timing.ts')).toHaveLength(0)
  })
})
