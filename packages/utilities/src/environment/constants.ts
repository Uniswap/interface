import { isDevEnv, isRNDev } from 'utilities/src/environment/env'
import { isMobileApp } from 'utilities/src/platform'

const isVitestRun = !!process.env.VITEST_POOL_ID
// TODO(INFRA-292): remove JEST_WORKER_ID when jest is fully deprecated
export const isTestRun = !!process.env.JEST_WORKER_ID || !!process.env.VITEST_POOL_ID
export const isNonTestDev = !isVitestRun && !isTestRun && (isMobileApp ? isRNDev() : isDevEnv())
/**
 * When enabled, all sessions and resources will be tracked in
 * DataDog RUM. Logs that are sent to productions will also be
 * sent from your local development.
 */
export const localDevDatadogEnabled = false
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const datadogEnabledBuild = (localDevDatadogEnabled || !isRNDev()) && !isTestRun && !isVitestRun
