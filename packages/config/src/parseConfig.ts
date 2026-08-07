import { BaseEnvFieldRules, BaseConfigSchema, BaseConfigValues } from '@universe/config/src/BaseConfig'
import type { BaseConfig } from '@universe/config/src/BaseConfig'
import { mergeEnvFieldRules, withEnvFieldRules } from '@universe/config/src/envFieldRules'
import type { EnvFieldRules, UntypedEnvFieldRules } from '@universe/config/src/envFieldRules'
import type { ConfigSchema, ConfigValues } from '@universe/config/src/types'
import { z } from 'zod'

interface BaseParseConfigParams<S extends ConfigSchema> {
  values: ConfigValues
  schema: S
}

/**
 * Validate config values against a zod schema and return a frozen, typed config object.
 *
 * By default, BaseConfigValues and BaseConfigSchema are merged in automatically.
 * Custom values/schema fields with the same key override the base version.
 * Pass `extendBaseConfig: false` to exclude base fields.
 *
 * `envFieldRules` declares per-environment required/forbidden fields, typed
 * against the merged shape (base + app). They are merged with
 * `BaseEnvFieldRules` (field lists unioned per environment) and enforced by
 * one object-level check on the merged schema, so the single `safeParse` below
 * reports rule violations aggregated with zod's own issues.
 *
 * @example
 * const config = parseConfig({
 *   values: { awsApiEndpoint: process.env.AWS_API_ENDPOINT },
 *   schema: z.object({ awsApiEndpoint: z.string().min(1) }),
 *   envFieldRules: { [Environment.Production]: { required: ['awsApiEndpoint'] } },
 * })
 * // config includes all BaseConfig fields + awsApiEndpoint
 */
export function parseConfig<S extends ConfigSchema>(
  params: BaseParseConfigParams<S> & {
    extendBaseConfig: false
    envFieldRules?: EnvFieldRules<z.infer<S>>
  },
): z.infer<S>

export function parseConfig<S extends ConfigSchema>(
  params: BaseParseConfigParams<S> & {
    extendBaseConfig?: true
    envFieldRules?: EnvFieldRules<Omit<BaseConfig, keyof z.infer<S> & string> & z.infer<S>>
  },
): Omit<BaseConfig, keyof z.infer<S> & string> & z.infer<S>

export function parseConfig<S extends ConfigSchema>(
  params: BaseParseConfigParams<S> & {
    extendBaseConfig?: boolean
    envFieldRules?: UntypedEnvFieldRules
  },
): Record<string, unknown> {
  const { values, schema, extendBaseConfig = true, envFieldRules = {} } = params
  const mergedValues = extendBaseConfig ? { ...BaseConfigValues, ...values } : values
  const mergedSchema = withEnvFieldRules(
    extendBaseConfig ? z.object({ ...BaseConfigSchema.shape, ...schema.shape }) : schema,
    mergeEnvFieldRules(BaseEnvFieldRules, envFieldRules),
  )

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
