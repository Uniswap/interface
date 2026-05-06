// oxlint-disable eslint-js/no-restricted-syntax allow process.env access
import type { BaseConfig } from '@universe/config'
import { boolFromString, parseConfig } from '@universe/config'
import { z } from 'zod'

/**
 * Raw process.env values for extension-specific config fields.
 * Base config values are merged in automatically by parseConfig.
 */
const extensionConfigValues = {
  version: process.env.VERSION,
  buildEnv: process.env.BUILD_ENV,
  wdyr: process.env.WDYR,
}

/** Zod schema for extension-specific config fields */
const extensionConfigSchema = z.object({
  version: z.string().optional().describe('Extension version string'),
  buildEnv: z.string().optional().describe('Extension build environment'),
  wdyr: boolFromString.describe('Is why-did-you-render enabled'),
})

export type Config = Omit<BaseConfig, keyof z.infer<typeof extensionConfigSchema> & string> &
  z.infer<typeof extensionConfigSchema>

// Module-level cache for config to avoid recomputing on every call
let cachedConfig: Config | undefined

export function getConfig(): Config {
  if (cachedConfig !== undefined) {
    return cachedConfig
  }
  cachedConfig = parseConfig({
    values: extensionConfigValues,
    schema: extensionConfigSchema,
  })
  return cachedConfig
}
