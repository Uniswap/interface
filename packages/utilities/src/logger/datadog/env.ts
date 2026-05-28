import { isBetaEnv, isDevEnv } from '@universe/environment'

export enum DatadogEnvironment {
  DEV = 'dev',
  BETA = 'beta',
  PROD = 'prod',
}

export function getDatadogEnvironment(): DatadogEnvironment {
  if (isDevEnv()) {
    return DatadogEnvironment.DEV
  }
  if (isBetaEnv()) {
    return DatadogEnvironment.BETA
  }
  return DatadogEnvironment.PROD
}
