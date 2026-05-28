import { BaseConfigSchema, BaseConfigValues } from '@universe/config/src/BaseConfig'
import type { BaseConfig } from '@universe/config/src/BaseConfig'
import { parseConfig } from '@universe/config/src/parseConfig'

// Module-level cache for config to avoid recomputing on every call
let cachedConfig: BaseConfig | undefined

/** @deprecated Use parseConfig() in app/package config files instead. This function only returns BaseConfig fields. */
export function getConfig(): BaseConfig {
  if (cachedConfig !== undefined) {
    return cachedConfig
  }
  cachedConfig = parseConfig({
    values: BaseConfigValues,
    schema: BaseConfigSchema,
    extendBaseConfig: false,
  }) as BaseConfig
  return cachedConfig
}
