import { isBetaEnv, isProdEnv } from 'utilities/src/environment/env'

export function getEnvName(): 'production' | 'staging' | 'development' {
  if (isBetaEnv()) {
    return 'staging'
  }
  if (isProdEnv()) {
    return 'production'
  }
  return 'development'
}
