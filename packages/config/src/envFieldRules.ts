import { Environment } from '@universe/config/src/Environment'
import type { ConfigSchema } from '@universe/config/src/types'

/**
 * Per-environment field presence rules, typed against the merged config shape
 * (base + app fields). `parseConfig` merges app rules with the base rules and
 * enforces them via a single object-level schema check, so violations surface
 * as ordinary zod issues aggregated with the schema's own.
 */
export type EnvFieldRules<Shape extends Record<string, unknown>> = Partial<
  Record<
    Environment,
    {
      /** Fields that must be set (non-empty) in this environment */
      required?: (keyof Shape & string)[]
      /** Fields that must be unset in this environment */
      forbidden?: (keyof Shape & string)[]
    }
  >
>

/** Rules with the shape typing erased, for merging base and app rules */
export type UntypedEnvFieldRules = EnvFieldRules<Record<string, unknown>>

/** Unions the required/forbidden field lists of two rule sets per environment. */
export function mergeEnvFieldRules(base: UntypedEnvFieldRules, extra: UntypedEnvFieldRules): UntypedEnvFieldRules {
  const merged: UntypedEnvFieldRules = {}
  for (const env of Object.values(Environment)) {
    const required = [...new Set([...(base[env]?.required ?? []), ...(extra[env]?.required ?? [])])]
    const forbidden = [...new Set([...(base[env]?.forbidden ?? []), ...(extra[env]?.forbidden ?? [])])]
    if (required.length > 0 || forbidden.length > 0) {
      merged[env] = { required, forbidden }
    }
  }
  return merged
}

/**
 * A field counts as unset when its parsed value is undefined/null/empty, or
 * equals what the field parses `undefined` into (its unset baseline) — so
 * fields with defaults (e.g. `z.coerce.number().default(8545)`) or transforms
 * (`boolFromString`) don't trip a forbidden rule when the env var is unset.
 */
function isUnsetFieldValue(params: { schema: ConfigSchema; key: string; value: unknown }): boolean {
  const { schema, key, value } = params
  if (value === undefined || value === null || value === '') {
    return true
  }
  const baseline = schema.shape[key]?.safeParse(undefined)
  return baseline?.success === true && Object.is(value, baseline.data)
}

function isEnvironment(value: unknown): value is Environment {
  return typeof value === 'string' && Object.values(Environment).includes(value as Environment)
}

/**
 * Attaches one object-level check that enforces `rules` against the parsed
 * sibling `environment`. Rule keys not present in the schema shape are
 * dropped, so the base rules stay harmless under `extendBaseConfig: false`
 * with schemas that omit the base fields; when no rule applies, the schema is
 * returned unchanged.
 */
export function withEnvFieldRules<T extends ConfigSchema>(schema: T, rules: UntypedEnvFieldRules): T {
  const applicable: UntypedEnvFieldRules = {}
  for (const env of Object.values(Environment)) {
    // The shape filter drops unknown keys silently: typos are compile errors
    // on the typed parseConfig path, but rules built through the type-erased
    // UntypedEnvFieldRules path get no runtime typo detection.
    const required = (rules[env]?.required ?? []).filter((key) => key in schema.shape)
    const forbidden = (rules[env]?.forbidden ?? []).filter((key) => key in schema.shape)
    if (required.length > 0 || forbidden.length > 0) {
      applicable[env] = { required, forbidden }
    }
  }
  if (Object.keys(applicable).length === 0) {
    return schema
  }
  return schema.check((payload) => {
    const values = payload.value as Record<string, unknown>
    const environment = values.environment
    if (!isEnvironment(environment)) {
      // Skip the extra issue when the schema parse already rejected `environment`
      if (!payload.issues.some((issue) => (issue.path ?? [])[0] === 'environment')) {
        payload.issues.push({
          code: 'custom',
          message: 'A valid environment value is required to enforce env field rules',
          path: ['environment'],
          input: payload.value,
          continue: true,
        })
      }
      return
    }
    for (const key of applicable[environment]?.required ?? []) {
      if (isUnsetFieldValue({ schema, key, value: values[key] })) {
        payload.issues.push({
          code: 'custom',
          message: `Required for environment "${environment}"`,
          path: [key],
          input: payload.value,
          continue: true,
        })
      }
    }
    for (const key of applicable[environment]?.forbidden ?? []) {
      if (!isUnsetFieldValue({ schema, key, value: values[key] })) {
        payload.issues.push({
          code: 'custom',
          message: `Forbidden for environment "${environment}"`,
          path: [key],
          input: payload.value,
          continue: true,
        })
      }
    }
  }) as T
}
