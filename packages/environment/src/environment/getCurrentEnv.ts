import { Environment } from '@universe/config'
import { isBetaEnv, isDevEnv } from './env'

export function getCurrentEnv(ctx: { isVercelEnvironment: boolean }): Environment {
  if (isDevEnv() || ctx.isVercelEnvironment) {
    return Environment.Development
  } else if (isBetaEnv()) {
    return Environment.Staging
  } else {
    return Environment.Production
  }
}
