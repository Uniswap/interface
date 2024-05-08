export const isJestRun = !!process.env.JEST_WORKER_ID
export const isNonJestDev = __DEV__ && !isJestRun
export const isDetoxBuild = process.env.DETOX_MODE
