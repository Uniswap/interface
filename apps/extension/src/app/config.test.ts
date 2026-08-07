import { parseConfig } from '@universe/config'
import { extensionConfigSchema, extensionEnvFieldRules, type Config } from 'src/app/config'

/** Minimal valid values: mandatory base fields plus the prod-required API keys */
const baseValues = {
  appId: 'extension',
  environment: 'production',
  buildEnv: 'prod',
  statsigApiKey: 'test-statsig-api-key',
  tradingApiKey: 'test-trading-api-key',
  uniswapApiKey: 'test-uniswap-api-key',
}

function parseExtensionValues(values: Record<string, unknown>): Config {
  return parseConfig({ values, schema: extensionConfigSchema, envFieldRules: extensionEnvFieldRules })
}

/** parseConfig logs violations via console.error before throwing; silence it for the guard */
function expectParseToThrow(values: Record<string, unknown>, message: string | RegExp): void {
  vi.spyOn(console, 'error').mockReturnValue()
  expect(() => parseExtensionValues(values)).toThrow(message)
}

describe('extension envFieldRules', () => {
  // Representative fields only — the full rule list lives in
  // extensionEnvFieldRules and the enforcement mechanism is tested in
  // @universe/config.
  it('rejects a required API key empty in production', () => {
    expectParseToThrow({ ...baseValues, statsigApiKey: '' }, 'statsigApiKey  Required for environment "production"')
  })

  it('accepts a representative production values map', () => {
    const config = parseExtensionValues(baseValues)

    expect(config.environment).toBe('production')
    expect(config.buildEnv).toBe('prod')
    expect(config.statsigApiKey).toBe('test-statsig-api-key')
  })

  it('leaves development unconstrained', () => {
    const config = parseExtensionValues({
      ...baseValues,
      environment: 'development',
      buildEnv: 'dev',
      statsigApiKey: '',
    })

    expect(config.environment).toBe('development')
    expect(config.statsigApiKey).toBe('')
  })

  // Pins the wdyr carve-out: the pulled production config scope sets WDYR (caught live
  // by an earlier CI run of this stack), so wdyr must stay unconstrained until that
  // scope entry is removed.
  it('accepts wdyr set to a non-empty value in production', () => {
    const config = parseExtensionValues({ ...baseValues, wdyr: 'false' })

    expect(config.environment).toBe('production')
    expect(config.wdyr).toBe(false)
  })

  // Extension e2e builds pull the production config scope (apps/extension/project.json
  // config:pull e2e -> CONFIG_ENV=production) and resolve environment=production, so
  // tradingApiUrlOverride is forbidden there (base env field rules). If the pulled
  // production scope ever sets TRADING_API_URL_OVERRIDE, the runtime parse surfaces it.
  it('rejects tradingApiUrlOverride in a production-scope values map', () => {
    expectParseToThrow(
      {
        ...baseValues,
        buildEnv: 'dev',
        isE2ETest: 'true',
        tradingApiUrlOverride: 'https://beta.trading-api-labs.interface.gateway.uniswap.org',
      },
      /tradingApiUrlOverride {2}Forbidden/,
    )
  })
})
