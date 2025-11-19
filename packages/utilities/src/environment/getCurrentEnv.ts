import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'

export enum Environment {
  DEV = 'dev',
  STAGING = 'staging',
  PROD = 'prod',
}

export function getCurrentEnv(ctx: { isVercelEnvironment: boolean }): Environment {
  if (isDevEnv() || ctx.isVercelEnvironment) {
    return Environment.DEV
  } else if (isBetaEnv()) {
    return Environment.STAGING
  } else {
    return Environment.PROD
  }
}
