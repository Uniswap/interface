import fs from 'node:fs'
import path from 'node:path'

/**
 * Regression tests for the hashcash worker factory wiring.
 */

const WORKERS_DIR = __dirname
const DEFAULT_FACTORY = path.join(WORKERS_DIR, 'hashcashWorker.ts')
const VITE_FACTORY = path.join(WORKERS_DIR, 'hashcashWorker.vite.ts')

describe('hashcashWorker factory wiring', () => {
  it('has both default and Vite factory variants present', () => {
    expect(fs.existsSync(DEFAULT_FACTORY)).toBe(true)
    expect(fs.existsSync(VITE_FACTORY)).toBe(true)
  })

  it('default factory references an on-disk worker source file', () => {
    // The default (Jest) factory relies on `new Worker(new URL(literal, import.meta.url))`
    // resolving a real file. If the worker source moves or renames, this fails.
    const source = fs.readFileSync(DEFAULT_FACTORY, 'utf8')
    const match = source.match(/new URL\(\s*['"]([^'"]+)['"]/)
    expect(match).not.toBeNull()

    const relativeUrl = match![1]!
    const resolved = path.resolve(WORKERS_DIR, relativeUrl)
    expect(fs.existsSync(resolved)).toBe(true)
  })

  it('Vite factory uses the ?worker query import', () => {
    // The `?worker` suffix is Vite-only syntax that bypasses the URL-path
    // restriction. Removing it would re-surface the original failure.
    const source = fs.readFileSync(VITE_FACTORY, 'utf8')
    expect(source).toMatch(/from\s+['"][^'"]+\?worker['"]/)
  })

  it('Vite factory and default factory export the same function name', () => {
    // The alias in wxt.config.ts swaps the module; both must expose
    // `createHashcashWorker` or callers break.
    const defaultSource = fs.readFileSync(DEFAULT_FACTORY, 'utf8')
    const viteSource = fs.readFileSync(VITE_FACTORY, 'utf8')
    expect(defaultSource).toMatch(/export function createHashcashWorker\b/)
    expect(viteSource).toMatch(/export function createHashcashWorker\b/)
  })
})
