import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PROCESS_ENV_OVERRIDES, resolveEnvConfigs } from './resolveEnvConfigs'

function writeEnv(dir: string, file: string, lines: Record<string, string>): void {
  const contents = Object.entries(lines)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  fs.writeFileSync(path.join(dir, file), contents)
}

describe('resolveEnvConfigs', () => {
  let rootDir: string

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolve-env-'))
  })

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true })
  })

  it('returns the base .env.new values', () => {
    writeEnv(rootDir, '.env.new', { FOO: 'base', BAR: 'baz' })

    const env = resolveEnvConfigs({ rootDir, isE2eTest: false, processEnv: {} })

    expect(env).toEqual({ FOO: 'base', BAR: 'baz' })
  })

  it('returns an empty object when .env.new is absent', () => {
    const env = resolveEnvConfigs({ rootDir, isE2eTest: false, processEnv: {} })

    expect(env).toEqual({})
  })

  it('layers .env.e2e.override on top of the base only when isE2eTest is true', () => {
    writeEnv(rootDir, '.env.new', { FOO: 'base', SHARED: 'base' })
    writeEnv(rootDir, '.env.e2e.override', { SHARED: 'e2e', E2E_ONLY: 'yes' })

    const withoutE2e = resolveEnvConfigs({ rootDir, isE2eTest: false, processEnv: {} })
    expect(withoutE2e).toEqual({ FOO: 'base', SHARED: 'base' })

    const withE2e = resolveEnvConfigs({ rootDir, isE2eTest: true, processEnv: {} })
    expect(withE2e).toEqual({ FOO: 'base', SHARED: 'e2e', E2E_ONLY: 'yes' })
  })

  it('applies .env.new.override and reports each changed key via onOverride', () => {
    writeEnv(rootDir, '.env.new', { FOO: 'base', SHARED: 'base', SAME: 'same' })
    writeEnv(rootDir, '.env.new.override', { SHARED: 'overridden', SAME: 'same', NEW_KEY: 'added' })

    const onOverride = vi.fn()
    const env = resolveEnvConfigs({ rootDir, isE2eTest: false, processEnv: {}, onOverride })

    expect(env).toEqual({ FOO: 'base', SHARED: 'overridden', SAME: 'same', NEW_KEY: 'added' })
    // Only the key whose value actually changed is reported (not SAME, not the brand-new NEW_KEY).
    expect(onOverride).toHaveBeenCalledTimes(1)
    expect(onOverride).toHaveBeenCalledWith('SHARED')
  })

  it('pulls PROCESS_ENV_OVERRIDES from processEnv, winning over the files', () => {
    const overrideKey = PROCESS_ENV_OVERRIDES[0]
    writeEnv(rootDir, '.env.new', { [overrideKey]: 'from-file', FOO: 'base' })

    const env = resolveEnvConfigs({
      rootDir,
      isE2eTest: false,
      processEnv: { [overrideKey]: 'from-process' },
    })

    expect(env[overrideKey]).toBe('from-process')
    expect(env.FOO).toBe('base')
  })

  it('ignores PROCESS_ENV_OVERRIDES keys that are undefined in processEnv', () => {
    const overrideKey = PROCESS_ENV_OVERRIDES[0]
    writeEnv(rootDir, '.env.new', { [overrideKey]: 'from-file' })

    const env = resolveEnvConfigs({ rootDir, isE2eTest: false, processEnv: {} })

    expect(env[overrideKey]).toBe('from-file')
  })

  it('assigns the resolved values back into processEnv when overrideProcessEnv is true', () => {
    writeEnv(rootDir, '.env.new', { FOO: 'base' })
    const processEnv: NodeJS.ProcessEnv = {}

    resolveEnvConfigs({ rootDir, isE2eTest: false, processEnv, overrideProcessEnv: true })

    expect(processEnv.FOO).toBe('base')
  })

  it('does not mutate processEnv when overrideProcessEnv is false', () => {
    writeEnv(rootDir, '.env.new', { FOO: 'base' })
    const processEnv: NodeJS.ProcessEnv = {}

    resolveEnvConfigs({ rootDir, isE2eTest: false, processEnv, overrideProcessEnv: false })

    expect(processEnv.FOO).toBeUndefined()
  })

  it('skips the e2e override layer when .env.e2e.override is missing', () => {
    writeEnv(rootDir, '.env.new', { FOO: 'base' })

    const env = resolveEnvConfigs({ rootDir, isE2eTest: true, processEnv: {} })

    expect(env).toEqual({ FOO: 'base' })
  })
})
