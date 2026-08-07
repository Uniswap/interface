// oxlint-disable eslint-js/no-restricted-syntax -- allow process.env access
import type { BaseConfig, EnvFieldRules } from '@universe/config'
import { AppId, boolFromString, Environment, parseConfig } from '@universe/config'
import {
  getUniswapServiceUrls as getUniswapServiceUrlsFromOverrides,
  type UniswapServiceUrls,
} from 'uniswap/src/constants/urls'
import { z } from 'zod'

/**
 * Raw process.env values for extension-specific config fields.
 * Base config values are merged in automatically by parseConfig.
 */
const extensionConfigValues = {
  appId: AppId.Extension,
  buildEnv: process.env.BUILD_ENV,
  wdyr: process.env.WDYR,
}

/** Zod schema for extension-specific config fields */
export const extensionConfigSchema = z.object({
  buildEnv: z.string().optional().describe('Extension build environment'),
  wdyr: boolFromString.describe('Is why-did-you-render enabled'),
})

export type Config = Omit<BaseConfig, keyof z.infer<typeof extensionConfigSchema> & string> &
  z.infer<typeof extensionConfigSchema>

/**
 * Env-scoped field rules for the extension, enforced by parseConfig together
 * with the base rules (URL overrides forbidden in production).
 */
export const extensionEnvFieldRules: EnvFieldRules<Config> = {
  [Environment.Production]: {
    required: ['statsigApiKey', 'tradingApiKey', 'uniswapApiKey'],
  },
}

// Module-level cache for config to avoid recomputing on every call
let cachedConfig: Config | undefined

export function getConfig(): Config {
  if (cachedConfig !== undefined) {
    return cachedConfig
  }
  cachedConfig = parseConfig({
    values: extensionConfigValues,
    schema: extensionConfigSchema,
    envFieldRules: extensionEnvFieldRules,
  })
  return cachedConfig
}

export function getUniswapServiceUrls(): UniswapServiceUrls {
  return getUniswapServiceUrlsFromOverrides(getConfig())
}
