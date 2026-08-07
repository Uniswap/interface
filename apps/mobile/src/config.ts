// oxlint-disable eslint-js/no-restricted-syntax -- allow process.env access
import type { BaseConfig, EnvFieldRules } from '@universe/config'
import { AppId, Environment, optionalString, parseConfig } from '@universe/config'
import DeviceInfo from 'react-native-device-info'
import {
  getUniswapServiceUrls as getUniswapServiceUrlsFromOverrides,
  type UniswapServiceUrls,
} from 'uniswap/src/constants/urls'
import { z } from 'zod'

/**
 * Mobile app config. Extends BaseConfig with mobile-specific fields.
 * Base config values (API keys, feature flags, URL overrides) are
 * included automatically by parseConfig.
 */
const mobileConfigValues = {
  appId: AppId.Mobile,
  appVersion: DeviceInfo.getVersion(),
  appsflyerApiKey: process.env.APPSFLYER_API_KEY,
  appsflyerAppId: process.env.APPSFLYER_APP_ID,
  onesignalAppId: process.env.ONESIGNAL_APP_ID,
  // Credentials for a dedicated Datadog RUM app used only by mobile e2e/CI builds. When present they
  // fully isolate e2e RUM from the production RUM app; when absent, e2e falls back to the prod app id
  // but hard-tags its data as env:dev + source:e2e. Consumed only when isE2ETest is true (see
  // DatadogProviderWrapper). Mobile-only, so lives here rather than in BaseConfig.
  datadogE2eClientToken: process.env.DATADOG_E2E_CLIENT_TOKEN,
  datadogE2eProjectId: process.env.DATADOG_E2E_PROJECT_ID,
}

export const mobileConfigSchema = z.object({
  appsflyerApiKey: optionalString.describe('API key for AppsFlyer'),
  appsflyerAppId: optionalString.describe('App ID for AppsFlyer'),
  onesignalAppId: optionalString.describe('App ID for OneSignal'),
  datadogE2eClientToken: optionalString.describe('Client token for the dedicated mobile e2e/CI Datadog RUM app'),
  datadogE2eProjectId: optionalString.describe('Project ID for the dedicated mobile e2e/CI Datadog RUM app'),
})

export type Config = Omit<BaseConfig, keyof z.infer<typeof mobileConfigSchema> & string> &
  z.infer<typeof mobileConfigSchema>

/**
 * Env-scoped field rules for the mobile app, enforced by parseConfig together
 * with the base rules (URL overrides forbidden in production).
 */
export const mobileEnvFieldRules: EnvFieldRules<Config> = {
  [Environment.Production]: {
    required: [
      'statsigApiKey',
      'tradingApiKey',
      'uniswapApiKey',
      'onesignalAppId',
      'appsflyerApiKey',
      'appsflyerAppId',
    ],
  },
}

// Module-level cache for config to avoid recomputing on every call
let cachedConfig: Config | undefined

export function getConfig(): Config {
  if (cachedConfig !== undefined) {
    return cachedConfig
  }
  cachedConfig = parseConfig({
    values: mobileConfigValues,
    schema: mobileConfigSchema,
    envFieldRules: mobileEnvFieldRules,
  })
  return cachedConfig
}

export function getUniswapServiceUrls(): UniswapServiceUrls {
  return getUniswapServiceUrlsFromOverrides(getConfig())
}
