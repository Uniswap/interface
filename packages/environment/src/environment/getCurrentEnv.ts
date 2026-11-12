import { Environment } from '@universe/config'
import { isBetaEnv, isDevEnv } from './env'

export function getCurrentEnv(): Environment {
  if (isDevEnv()) {
    return Environment.Development
  } else if (isBetaEnv()) {
    return Environment.Staging
  } else {
    return Environment.Production
  }
}
