import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AppId } from './AppId'
import { BaseConfigSchema, BaseConfigValues } from './BaseConfig'
import { optionalString } from './commonSchemas'
import { Environment } from './Environment'
import { parseConfig } from './parseConfig'

describe('parseConfig', () => {
  describe('basic validation', () => {
    it('validates and returns typed config', () => {
      const config = parseConfig({
        values: { apiUrl: 'https://example.com', debug: 'true' },
        schema: z.object({ apiUrl: z.string(), debug: z.string() }),
        extendBaseConfig: false,
      })

      expect(config.apiUrl).toBe('https://example.com')
      expect(config.debug).toBe('true')
    })

    it('applies default values for undefined fields', () => {
      const config = parseConfig({
        values: {},
        schema: z.object({
          apiUrl: z.string().default('http://localhost'),
          port: z.coerce.number().default(3000),
        }),
        extendBaseConfig: false,
      })

      expect(config.apiUrl).toBe('http://localhost')
      expect(config.port).toBe(3000)
    })

    it('allows optional fields to be undefined', () => {
      const config = parseConfig({
        values: {},
        schema: z.object({ optional: z.string().optional() }),
        extendBaseConfig: false,
      })

      expect(config.optional).toBeUndefined()
    })

    it('applies transforms', () => {
      const boolStr = z.enum(['true', 'false']).transform((v) => v === 'true')

      const config = parseConfig({
        values: { enabled: 'true' },
        schema: z.object({ enabled: boolStr }),
        extendBaseConfig: false,
      })

      expect(config.enabled).toBe(true)
    })

    it('validates with z.coerce for numeric strings', () => {
      const config = parseConfig({
        values: { port: '8080' },
        schema: z.object({ port: z.coerce.number().min(1).max(65535) }),
        extendBaseConfig: false,
      })

      expect(config.port).toBe(8080)
    })

    it('validates enum values', () => {
      const config = parseConfig({
        values: { nodeEnv: 'production' },
        schema: z.object({ nodeEnv: z.enum(['development', 'production', 'test']) }),
        extendBaseConfig: false,
      })

      expect(config.nodeEnv).toBe('production')
    })

    it('returns a frozen object', () => {
      const config = parseConfig({
        values: { key: 'value' },
        schema: z.object({ key: z.string() }),
        extendBaseConfig: false,
      })

      expect(Object.isFrozen(config)).toBe(true)
    })
  })

  describe('error handling', () => {
    it('throws when a required field is missing', () => {
      expect(() =>
        parseConfig({
          values: {},
          schema: z.object({ apiUrl: z.string() }),
          extendBaseConfig: false,
        }),
      ).toThrow('Config validation failed')
    })

    it('reports all missing fields in a single error', () => {
      try {
        parseConfig({
          values: {},
          schema: z.object({ first: z.string(), second: z.string(), third: z.string() }),
          extendBaseConfig: false,
        })
        expect.fail('should have thrown')
      } catch (e) {
        const message = (e as Error).message
        expect(message).toContain('first')
        expect(message).toContain('second')
        expect(message).toContain('third')
      }
    })

    it('throws on invalid enum value', () => {
      expect(() =>
        parseConfig({
          values: { env: 'invalid' },
          schema: z.object({ env: z.enum(['development', 'production']) }),
          extendBaseConfig: false,
        }),
      ).toThrow('Config validation failed')
    })
  })

  describe('environment wire aliases', () => {
    // The exact failure path of getConfig(): BaseConfigSchema parsed with
    // extendBaseConfig: false. The backend shared deployer injects
    // ENVIRONMENT=<stack name> ('dev'/'staging'/'prod') on every ECS container.
    const parseEnvironment = (environment: string | undefined): unknown =>
      parseConfig({
        values: { appId: AppId.MissionControl, environment },
        schema: BaseConfigSchema,
        extendBaseConfig: false,
      }).environment

    it('parses the deployer short form "dev" as development', () => {
      expect(parseEnvironment('dev')).toBe(Environment.Development)
    })

    it('parses the deployer short form "prod" as production', () => {
      expect(parseEnvironment('prod')).toBe(Environment.Production)
    })

    it.each([Environment.Development, Environment.Staging, Environment.Production])(
      'passes canonical value "%s" through unchanged',
      (value) => {
        expect(parseEnvironment(value)).toBe(value)
      },
    )

    it('throws when unset (environment is mandatory)', () => {
      expect(() => parseEnvironment(undefined)).toThrow('Config validation failed')
    })

    it('still rejects unknown environment values', () => {
      expect(() => parseEnvironment('sandbox')).toThrow('Config validation failed')
    })
  })

  describe('extendBaseConfig', () => {
    it('includes base config fields by default', () => {
      const config = parseConfig({
        values: { customField: 'hello' },
        schema: z.object({ customField: z.string() }),
      })

      expect(config.customField).toBe('hello')
      expect('alchemyApiKey' in config).toBe(true)
      expect('nodeEnv' in config).toBe(true)
    })

    it('allows overriding base config fields', () => {
      const config = parseConfig({
        values: { walletConnectProjectId: 'custom-id' },
        schema: z.object({ walletConnectProjectId: z.string().min(1) }),
      })

      expect(config.walletConnectProjectId).toBe('custom-id')
    })

    it('excludes base config fields when extendBaseConfig is false', () => {
      const config = parseConfig({
        values: { customField: 'hello' },
        schema: z.object({ customField: z.string() }),
        extendBaseConfig: false,
      })

      expect(config.customField).toBe('hello')
      expect('alchemyApiKey' in config).toBe(false)
      expect('nodeEnv' in config).toBe(false)
    })

    it('has expected keys in BaseConfigValues', () => {
      const keys = Object.keys(BaseConfigValues)

      expect(keys).toContain('alchemyApiKey')
      expect(keys).toContain('isE2ETest')
      expect(keys).toContain('walletConnectProjectId')
      expect(keys).toContain('nodeEnv')
      expect(keys).toContain('environment')
    })

    it('infers correct types from schema', () => {
      const config = parseConfig({
        values: { name: 'test', count: '5', enabled: 'true' },
        schema: z.object({
          name: z.string(),
          count: z.coerce.number(),
          enabled: z.unknown().transform((v): boolean => v === 'true'),
        }),
        extendBaseConfig: false,
      })

      // These assignments verify the inferred types at compile time.
      // If the generics are wrong, TypeScript will error here.
      const name: string = config.name
      const count: number = config.count
      const enabled: boolean = config.enabled
      expect(name).toBe('test')
      expect(count).toBe(5)
      expect(enabled).toBe(true)

      // With extendBaseConfig (default), base fields should also be typed
      const extended = parseConfig({
        values: { custom: 'hello' },
        schema: z.object({ custom: z.string() }),
      })

      const custom: string = extended.custom
      const nodeEnv: 'development' | 'production' | 'test' = extended.nodeEnv
      expect(custom).toBe('hello')
      expect(typeof nodeEnv).toBe('string')
    })

    it('surfaces isBetaUsingProdApi through the base config (forwarded to url overrides)', () => {
      // Guards the beta API-target switch: callers pass getConfig() wholesale to
      // getUniswapServiceUrls, so the parsed config must retain this field.
      const enabled = parseConfig({
        values: { isBetaUsingProdApi: 'true' },
        schema: z.object({}),
      })
      expect(enabled.isBetaUsingProdApi).toBe(true)

      const defaulted = parseConfig({
        values: {},
        schema: z.object({}),
      })
      expect(defaulted.isBetaUsingProdApi).toBe(false)
    })

    it('has matching keys in BaseConfigSchema and BaseConfigValues', () => {
      const schemaKeys = Object.keys(BaseConfigSchema.shape).sort()
      const valueKeys = Object.keys(BaseConfigValues).sort()

      expect(schemaKeys).toEqual(valueKeys)
    })
  })

  describe('configSchemaVersion', () => {
    it('defaults to 0 when CONFIG_SCHEMA_VERSION is unset', () => {
      const config = parseConfig({
        values: {},
        schema: z.object({}),
      })

      expect(config.configSchemaVersion).toBe(0)
    })

    it('coerces an explicit numeric string', () => {
      const config = parseConfig({
        values: { configSchemaVersion: '3' },
        schema: z.object({}),
      })

      expect(config.configSchemaVersion).toBe(3)
    })

    it('rejects non-integer values', () => {
      expect(() =>
        parseConfig({
          values: { configSchemaVersion: '1.5' },
          schema: z.object({}),
        }),
      ).toThrow('Config validation failed')
    })

    it('rejects non-numeric values', () => {
      expect(() =>
        parseConfig({
          values: { configSchemaVersion: 'not-a-number' },
          schema: z.object({}),
        }),
      ).toThrow('Config validation failed')
    })
  })

  describe('mandatory environment', () => {
    it('throws when environment is missing from the values', () => {
      expect(() =>
        parseConfig({
          values: { appId: AppId.Web, environment: undefined },
          schema: BaseConfigSchema,
          extendBaseConfig: false,
        }),
      ).toThrow(/environment/)
    })

    it('still parses via the BaseConfigValues derivation (dev-mode parse unchanged)', () => {
      // BaseConfigValues derives environment from ENVIRONMENT ?? NODE_ENV, so the
      // merged values always carry it even though the schema no longer defaults it.
      const config = parseConfig({
        values: {},
        schema: z.object({}),
      })

      expect(config.environment).toBe(Environment.Development)
    })
  })

  describe('envFieldRules (integration; behavior unit tests live in envFieldRules.test.ts)', () => {
    it('enforces app rules and base rules together in one parse', () => {
      try {
        parseConfig({
          values: {
            environment: Environment.Production,
            customApiKey: '',
            statsigProxyUrlOverride: 'https://custom-statsig.example.com',
          },
          schema: z.object({ customApiKey: optionalString }),
          envFieldRules: { [Environment.Production]: { required: ['customApiKey'] } },
        })
        expect.fail('should have thrown')
      } catch (e) {
        const message = (e as Error).message
        // App-provided rule
        expect(message).toContain('customApiKey  Required for environment "production"')
        // Base rule, unioned in for the same environment
        expect(message).toContain('statsigProxyUrlOverride  Forbidden for environment "production"')
      }
    })

    it('forbids a base override URL in production and allows it outside production', () => {
      expect(() =>
        parseConfig({
          values: { environment: Environment.Production, statsigProxyUrlOverride: 'https://custom.example.com' },
          schema: z.object({}),
        }),
      ).toThrow('statsigProxyUrlOverride  Forbidden for environment "production"')

      const staging = parseConfig({
        values: { environment: Environment.Staging, statsigProxyUrlOverride: 'https://custom.example.com' },
        schema: z.object({}),
      })
      expect(staging.statsigProxyUrlOverride).toBe('https://custom.example.com')

      const emptyInProduction = parseConfig({
        values: { environment: Environment.Production, statsigProxyUrlOverride: '' },
        schema: z.object({}),
      })
      expect(emptyInProduction.statsigProxyUrlOverride).toBe('')
    })

    it('still enforces a base rule on a field the app schema overrides', () => {
      // Rules are keyed by field name against the merged shape, so overriding
      // the field schema does not detach the base rule.
      expect(() =>
        parseConfig({
          values: { environment: Environment.Production, statsigProxyUrlOverride: 'https://custom.example.com' },
          schema: z.object({ statsigProxyUrlOverride: z.string() }),
        }),
      ).toThrow('statsigProxyUrlOverride  Forbidden for environment "production"')
    })

    it('enforces base rules for a BaseConfigSchema parse with extendBaseConfig: false (getConfig path)', () => {
      // BaseConfigSchema is not self-enforcing; getConfig still goes through
      // parseConfig, which merges the base rules regardless.
      expect(() =>
        parseConfig({
          values: {
            appId: AppId.Web,
            environment: Environment.Production,
            statsigProxyUrlOverride: 'https://custom.example.com',
          },
          schema: BaseConfigSchema,
          extendBaseConfig: false,
        }),
      ).toThrow('statsigProxyUrlOverride  Forbidden for environment "production"')
    })

    it('skips base rule keys that are not in the schema shape (extendBaseConfig: false)', () => {
      const config = parseConfig({
        values: {
          environment: Environment.Production,
          apiKey: 'key',
          statsigProxyUrlOverride: 'https://custom.example.com',
        },
        schema: z.object({ environment: z.enum(Environment), apiKey: optionalString }),
        extendBaseConfig: false,
      })

      expect(config.apiKey).toBe('key')
      expect('statsigProxyUrlOverride' in config).toBe(false)
    })

    it('rejects rule keys that are not in the config shape at compile time', () => {
      const config = parseConfig({
        values: { environment: Environment.Development, apiKey: 'key' },
        schema: z.object({ environment: z.enum(Environment), apiKey: optionalString }),
        envFieldRules: {
          // @ts-expect-error -- 'notAField' is not a key of the schema shape
          [Environment.Production]: { required: ['notAField'] },
        },
        extendBaseConfig: false,
      })

      expect(config.apiKey).toBe('key')
    })
  })
})
