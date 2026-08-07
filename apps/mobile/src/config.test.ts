import { parseConfig } from '@universe/config'
import { mobileConfigSchema, mobileEnvFieldRules, type Config } from 'src/config'

/** Minimal valid values: mandatory base fields plus representative prod-required fields */
const baseValues = {
  appId: 'mobile',
  environment: 'production',
  appsflyerApiKey: 'test-appsflyer-api-key',
  appsflyerAppId: 'id123456789',
  onesignalAppId: 'test-onesignal-app-id',
  statsigApiKey: 'test-statsig-api-key',
  tradingApiKey: 'test-trading-api-key',
  uniswapApiKey: 'test-uniswap-api-key',
}

function parseMobileValues(values: Record<string, unknown>): Config {
  return parseConfig({ values, schema: mobileConfigSchema, envFieldRules: mobileEnvFieldRules })
}

/** parseConfig logs violations via console.error before throwing; silence it for the guard */
function expectParseToThrow(values: Record<string, unknown>, message: string): void {
  vi.spyOn(console, 'error').mockReturnValue()
  expect(() => parseMobileValues(values)).toThrow(message)
}

describe('mobile envFieldRules', () => {
  // Representative fields only — one app field and one base API key; the full
  // rule list lives in mobileEnvFieldRules and the enforcement mechanism is
  // tested in @universe/config.
  it('rejects a required app field empty in production', () => {
    expectParseToThrow({ ...baseValues, onesignalAppId: '' }, 'onesignalAppId  Required for environment "production"')
  })

  it('rejects a required base API key empty in production', () => {
    expectParseToThrow({ ...baseValues, statsigApiKey: '' }, 'statsigApiKey  Required for environment "production"')
  })

  it('accepts a representative production values map', () => {
    const config = parseMobileValues(baseValues)

    expect(config.environment).toBe('production')
    expect(config.onesignalAppId).toBe('test-onesignal-app-id')
    expect(config.statsigApiKey).toBe('test-statsig-api-key')
  })

  it('leaves development and staging unconstrained', () => {
    const dev = parseMobileValues({ appId: 'mobile', environment: 'development', statsigApiKey: '' })
    expect(dev.environment).toBe('development')
    expect(dev.onesignalAppId).toBe('')

    const staging = parseMobileValues({ appId: 'mobile', environment: 'staging', statsigApiKey: '' })
    expect(staging.environment).toBe('staging')
    expect(staging.onesignalAppId).toBe('')
  })
})
