// oxlint-disable eslint-js/no-restricted-syntax -- allow process.env access
import type { BaseConfig } from '@universe/config'
import { optionalString, parseConfig } from '@universe/config'
import { z } from 'zod'

/**
 * Mobile app config. Extends BaseConfig with mobile-specific fields.
 * Base config values (API keys, feature flags, URL overrides) are
 * included automatically by parseConfig.
 */
const mobileConfigValues = {
  appsflyerApiKey: process.env.APPSFLYER_API_KEY,
  appsflyerAppId: process.env.APPSFLYER_APP_ID,
  onesignalAppId: process.env.ONESIGNAL_APP_ID,
}

const mobileConfigSchema = z.object({
  appsflyerApiKey: optionalString.describe('API key for AppsFlyer'),
  appsflyerAppId: optionalString.describe('App ID for AppsFlyer'),
  onesignalAppId: optionalString.describe('App ID for OneSignal'),
})

export type Config = Omit<BaseConfig, keyof z.infer<typeof mobileConfigSchema> & string> &
  z.infer<typeof mobileConfigSchema>

// Module-level cache for config to avoid recomputing on every call
let cachedConfig: Config | undefined

export function getConfig(): Config {
  if (cachedConfig !== undefined) {
    return cachedConfig
  }
  cachedConfig = parseConfig({
    values: mobileConfigValues,
    schema: mobileConfigSchema,
  })
  return cachedConfig
}
