import { isRNDev } from 'utilities/src/environment/env'

export const isE2EMode = Boolean(process.env.E2E_MODE)
export const isJestRun = !!process.env.JEST_WORKER_ID
export const isNonJestDev = isRNDev() && !isJestRun
/**
 * When enabled, all sessions and resources will be tracked in
 * DataDog RUM. Logs that are sent to productions will also be
 * sent from your local development.
 */
export const localDevDatadogEnabled = false
export const datadogEnabled = (localDevDatadogEnabled || !isRNDev()) && !isJestRun
