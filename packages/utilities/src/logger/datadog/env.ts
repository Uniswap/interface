import { isBetaEnv, isDevEnv, isE2eTestEnv } from '@universe/environment'

export enum DatadogEnvironment {
  DEV = 'dev',
  BETA = 'beta',
  PROD = 'prod',
}

export function getDatadogEnvironment(): DatadogEnvironment {
  // e2e/CI runs report under the dev environment. The `source:e2e` / `test_type:e2e` tags set in
  // DatadogProviderWrapper separate synthetic test telemetry from real dev traffic, so a dedicated
  // env value isn't needed. Checked first so e2e data never lands in prod/beta queries even when an
  // e2e build is produced from a prod/beta bundle id. Build-gated on isE2eTestEnv (baked IS_E2E_TEST).
  if (isE2eTestEnv()) {
    return DatadogEnvironment.DEV
  }
  if (isDevEnv()) {
    return DatadogEnvironment.DEV
  }
  if (isBetaEnv()) {
    return DatadogEnvironment.BETA
  }
  return DatadogEnvironment.PROD
}
