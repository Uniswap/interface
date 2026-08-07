import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { boolFromString, optionalString } from './commonSchemas'
import { mergeEnvFieldRules, withEnvFieldRules } from './envFieldRules'
import type { EnvFieldRules, UntypedEnvFieldRules } from './envFieldRules'
import { Environment } from './Environment'

describe('mergeEnvFieldRules', () => {
  it('unions the required and forbidden lists per environment', () => {
    const merged = mergeEnvFieldRules(
      { [Environment.Production]: { required: ['a'], forbidden: ['x'] } },
      { [Environment.Production]: { required: ['b'], forbidden: ['y'] } },
    )

    expect(merged[Environment.Production]).toEqual({ required: ['a', 'b'], forbidden: ['x', 'y'] })
  })

  it('deduplicates fields listed by both rule sets', () => {
    const merged = mergeEnvFieldRules(
      { [Environment.Production]: { required: ['a'] } },
      { [Environment.Production]: { required: ['a', 'b'] } },
    )

    expect(merged[Environment.Production]?.required).toEqual(['a', 'b'])
  })

  it('keeps environments contributed by only one side', () => {
    const merged = mergeEnvFieldRules(
      { [Environment.Production]: { forbidden: ['x'] } },
      { [Environment.Staging]: { required: ['a'] } },
    )

    expect(merged[Environment.Production]?.forbidden).toEqual(['x'])
    expect(merged[Environment.Staging]?.required).toEqual(['a'])
    expect(merged[Environment.Development]).toBeUndefined()
  })

  it('cannot relax a base rule: apps can only add fields, not remove them', () => {
    const merged = mergeEnvFieldRules(
      { [Environment.Production]: { forbidden: ['baseOverride'] } },
      { [Environment.Production]: { forbidden: [] } },
    )

    expect(merged[Environment.Production]?.forbidden).toEqual(['baseOverride'])
  })

  it('returns an empty rule set when both sides are empty', () => {
    expect(mergeEnvFieldRules({}, {})).toEqual({})
  })
})

describe('withEnvFieldRules', () => {
  const schema = z.object({
    environment: z.enum(Environment),
    apiKey: optionalString,
    devUrlOverride: optionalString,
  })
  const rules: EnvFieldRules<z.infer<typeof schema>> = {
    [Environment.Staging]: { required: ['apiKey'] },
    [Environment.Production]: { required: ['apiKey'], forbidden: ['devUrlOverride'] },
  }
  const enforced = withEnvFieldRules(schema, rules as UntypedEnvFieldRules)

  function issueSummaries(result: z.ZodSafeParseResult<unknown>): string[] {
    return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
  }

  it('passes in an environment with no rules, with required fields empty and forbidden fields set', () => {
    const result = enforced.safeParse({
      environment: Environment.Development,
      apiKey: '',
      devUrlOverride: 'http://localhost:1234',
    })

    expect(result.success).toBe(true)
  })

  it('reports a required violation when the field is empty or missing in a listed environment', () => {
    expect(issueSummaries(enforced.safeParse({ environment: Environment.Staging, apiKey: '' }))).toEqual([
      'apiKey: Required for environment "staging"',
    ])
    expect(issueSummaries(enforced.safeParse({ environment: Environment.Production }))).toContain(
      'apiKey: Required for environment "production"',
    )
  })

  it('reports a forbidden violation when the field is set in a listed environment', () => {
    const result = enforced.safeParse({
      environment: Environment.Production,
      apiKey: 'key',
      devUrlOverride: 'http://localhost:1234',
    })

    expect(issueSummaries(result)).toEqual(['devUrlOverride: Forbidden for environment "production"'])
  })

  it('treats an empty string as unset for forbidden fields', () => {
    const result = enforced.safeParse({ environment: Environment.Production, apiKey: 'key', devUrlOverride: '' })

    expect(result.success).toBe(true)
  })

  it('aggregates multiple violations into one parse result', () => {
    const result = enforced.safeParse({
      environment: Environment.Production,
      devUrlOverride: 'http://localhost:1234',
    })

    expect(issueSummaries(result)).toEqual([
      'apiKey: Required for environment "production"',
      'devUrlOverride: Forbidden for environment "production"',
    ])
  })

  it('treats a field parsing to its unset baseline as unset (defaults apply when the env var is unset)', () => {
    const withDefault = withEnvFieldRules(
      z.object({ environment: z.enum(Environment), anvilPort: z.coerce.number().default(8545) }),
      { [Environment.Production]: { forbidden: ['anvilPort'] } },
    )

    // Unset in production: the default applies and is not a violation
    expect(withDefault.safeParse({ environment: Environment.Production }).success).toBe(true)
    // Explicitly overridden in production: violation
    expect(withDefault.safeParse({ environment: Environment.Production, anvilPort: '7000' }).success).toBe(false)
    // Explicitly set to the unset baseline: indistinguishable from unset
    expect(withDefault.safeParse({ environment: Environment.Production, anvilPort: '8545' }).success).toBe(true)
    // Overridden outside production: fine
    expect(withDefault.safeParse({ environment: Environment.Development, anvilPort: '7000' }).success).toBe(true)
  })

  it('treats transform outputs equal to the unset baseline as unset (boolFromString)', () => {
    const withBool = withEnvFieldRules(z.object({ environment: z.enum(Environment), debugFlag: boolFromString }), {
      [Environment.Production]: { forbidden: ['debugFlag'] },
    })

    expect(withBool.safeParse({ environment: Environment.Production }).success).toBe(true)
    expect(withBool.safeParse({ environment: Environment.Production, debugFlag: 'true' }).success).toBe(false)
    // 'false' parses to the same output as unset, so it is not a violation
    expect(withBool.safeParse({ environment: Environment.Production, debugFlag: 'false' }).success).toBe(true)
  })

  it('reports the environment when rules apply but no valid environment is present', () => {
    const noEnvironment = withEnvFieldRules(z.object({ apiKey: optionalString }), {
      [Environment.Production]: { required: ['apiKey'] },
    })

    const result = noEnvironment.safeParse({ apiKey: 'key' })

    expect(issueSummaries(result)).toEqual([
      'environment: A valid environment value is required to enforce env field rules',
    ])
  })

  it('drops rule keys that are not in the schema shape and returns the schema unchanged when none apply', () => {
    const plain = z.object({ a: z.string() })

    expect(withEnvFieldRules(plain, { [Environment.Production]: { required: ['notInShape'] } })).toBe(plain)
    expect(withEnvFieldRules(plain, {})).toBe(plain)
  })
})
