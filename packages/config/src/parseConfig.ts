import { BaseConfigSchema, BaseConfigValues } from '@universe/config/src/BaseConfig'
import type { BaseConfig } from '@universe/config/src/BaseConfig'
import type { ConfigSchema, ConfigValues } from '@universe/config/src/types'
import { z } from 'zod'

interface ParseConfigParams<S extends ConfigSchema> {
  values: ConfigValues
  schema: S
  extendBaseConfig?: boolean
}

/**
 * Validate config values against a zod schema and return a frozen, typed config object.
 *
 * By default, BaseConfigValues and BaseConfigSchema are merged in automatically.
 * Custom values/schema fields with the same key override the base version.
 * Pass `extendBaseConfig: false` to exclude base fields.
 *
 * @example
 * const config = parseConfig({
 *   values: { awsApiEndpoint: process.env.REACT_APP_AWS_API_ENDPOINT },
 *   schema: z.object({ awsApiEndpoint: z.string().min(1) }),
 * })
 * // config includes all BaseConfig fields + awsApiEndpoint
 */
export function parseConfig<S extends ConfigSchema>(
  params: ParseConfigParams<S> & { extendBaseConfig: false },
): z.infer<S>

export function parseConfig<S extends ConfigSchema>(
  params: ParseConfigParams<S> & { extendBaseConfig?: true },
): Omit<BaseConfig, keyof z.infer<S> & string> & z.infer<S>

export function parseConfig<S extends ConfigSchema>(params: ParseConfigParams<S>): Record<string, unknown> {
  const { values, schema, extendBaseConfig = true } = params
  const mergedValues = extendBaseConfig ? { ...BaseConfigValues, ...values } : values
  const mergedSchema = extendBaseConfig ? BaseConfigSchema.extend(schema.shape) : schema

  const parsed = mergedSchema.safeParse(mergedValues)

  if (parsed.success) {
    return Object.freeze(parsed.data as Record<string, unknown>)
  }

  const errors = parsed.error.issues.map((issue) => ({
    key: issue.path.join('.'),
    error: issue.message,
  }))

  // oxlint-disable-next-line no-console -- avoid logger due to sensitive information and also to avoid utilities dep
  console.error('The provided config values did not match the expected config schema. Errors:', errors)
  throw new Error(`Config validation failed:\n${errors.map(({ key, error }) => `${key}  ${error}`).join('\n')}`)
}
