// oxlint-disable eslint-js/no-restricted-syntax -- env resolution utility legitimately reads/writes process.env
import fs from 'node:fs'
import path from 'node:path'
import { parse as dotenvParse } from 'dotenv'

// Env vars that should be read directly from process.env instead of the .env files.
export const PROCESS_ENV_OVERRIDES = ['CI', 'IS_E2E_TEST', 'JEST_WORKER_ID', 'VITEST_WORKER_ID', 'SKIP_CSP', 'DISABLE_SOURCEMAP', 'CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE']

interface ResolveEnvConfigsOptions {
  /** Directory containing .env / .env.e2e.override / .env.override (i.e. apps/web). */
  rootDir: string
  /** When true, layer .env.e2e.override on top (e2e builds and the Playwright runner). */
  isE2eTest: boolean
  /** Source for PROCESS_ENV_OVERRIDES. Defaults to process.env. */
  processEnv?: NodeJS.ProcessEnv
  /** Called with each key whose value .env.override changes (vite logs these). */
  onOverride?: (key: string) => void
  /** When true, Object.assign the resolved values back into processEnv (override wins). */
  overrideProcessEnv?: boolean
}

/**
 * Resolves the unified ("new configs") env exactly the way vite.config.mts does, so the
 * Vite build and the Playwright test runner produce an identical config:
 *   .env (base) → .env.e2e.override (e2e only) → .env.override → PROCESS_ENV_OVERRIDES.
 */
export function resolveEnvConfigs({
  rootDir,
  isE2eTest,
  processEnv = process.env,
  onOverride,
  overrideProcessEnv = false,
}: ResolveEnvConfigsOptions): Record<string, string> {
  let env: Record<string, string> = {}

  // Base layer: .env which is pulled from the remote config service. When it's absent
  // fall back to the checked-in .env.dev defaults so the app still runs in dev mode.
  const newEnvPath = path.resolve(rootDir, '.env')
  const devEnvPath = path.resolve(rootDir, '.env.dev')
  const baseEnvPath = fs.existsSync(newEnvPath) ? newEnvPath : devEnvPath
  if (baseEnvPath === devEnvPath) {
    console.log('No .env file located, using the checked in dev defaults')
  }
  try {
    env = dotenvParse(fs.readFileSync(baseEnvPath))
  } catch (error) {
    throw new Error(`Failed to parse ${baseEnvPath}`, { cause: error })
  }

  // E2E override layer: overrides applied only to playwright e2e tests.
  // Ideally the need for these would be phased out eventually
  const e2eTestOverridesEnvPath = path.resolve(rootDir, '.env.e2e.override')
  if (isE2eTest && fs.existsSync(e2eTestOverridesEnvPath)) {
    let e2eTestOverridesEnv: Record<string, string> = {}
    try {
      e2eTestOverridesEnv = dotenvParse(fs.readFileSync(e2eTestOverridesEnvPath))
    } catch (error) {
      throw new Error(`Failed to parse ${e2eTestOverridesEnvPath}`, { cause: error })
    }
    env = { ...env, ...e2eTestOverridesEnv }
  }

  // User-defined override layer
  const overridesEnvPath = path.resolve(rootDir, '.env.override')
  if (fs.existsSync(overridesEnvPath)) {
    let overridesEnv: Record<string, string> = {}
    try {
      overridesEnv = dotenvParse(fs.readFileSync(overridesEnvPath))
    } catch (error) {
      throw new Error(`Failed to parse ${overridesEnvPath}`, { cause: error })
    }
    for (const [key, value] of Object.entries(overridesEnv)) {
      if (key in env && env[key] !== value) {
        onOverride?.(key)
      }
      env[key] = value
    }
  }

  // Values that must come from the live process.env, not the .env files. Applied 
  // after the file layers so they have the final say in env.
  for (const key of PROCESS_ENV_OVERRIDES) {
    if (processEnv[key] !== undefined) {
      env[key] = processEnv[key] as string
    }
  }

  if (overrideProcessEnv) {
    Object.assign(processEnv, env)
  }

  return env
}

/**
 * Loads env for the Playwright test runner (Node) so its getConfig() matches the browser bundle.
 * Loads exactly the files the build loaded (.env + overrides), so the runner config is identical.
 */
export function loadTestRunnerEnv(rootDir: string): void {
  // The runner is always e2e: set IS_E2E_TEST so the e2e override layers and getConfig().isE2ETest
  // matches the bundle, then overlay the resolved config onto process.env.
  process.env.IS_E2E_TEST = 'true'
  resolveEnvConfigs({ rootDir, isE2eTest: true, overrideProcessEnv: true })
}
