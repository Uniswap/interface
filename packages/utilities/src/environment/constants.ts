export const isDetoxBuild = Boolean(process.env.DETOX_MODE)
export const isJestRun = !!process.env.JEST_WORKER_ID
export const isNonJestDev = __DEV__ && !isJestRun
