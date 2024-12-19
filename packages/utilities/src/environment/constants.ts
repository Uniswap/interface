export const isDetoxBuild = Boolean(process.env.DETOX_MODE)
export const isJestRun = !!process.env.JEST_WORKER_ID
export const isNonJestDev = window.__DEV__ && !isJestRun
/**
 * When enabled, all sessions and resources will be tracked in
 * DataDog RUM. Logs that are sent to productions will also be
 * sent from your local development.
 */
export const localDevDatadogEnabled = false
export const datadogEnabled = localDevDatadogEnabled || !window.__DEV__
