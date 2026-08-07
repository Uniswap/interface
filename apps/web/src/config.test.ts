import { parseConfig } from '@universe/config'
import { webConfigSchema, webEnvFieldRules, type Config } from '~/config'

/** Minimal valid values for the schema's own required fields plus mandatory base fields */
const baseValues = {
  appId: 'web',
  environment: 'production',
  walletConnectProjectId: 'test-walletconnect-project-id',
  awsApiEndpoint: 'https://api.uniswap.org/v1/graphql',
  uniswapGatewayDns: 'https://interface.gateway.uniswap.org/v2',
  statsigApiKey: 'test-statsig-api-key',
  tradingApiKey: 'test-trading-api-key',
  uniswapApiKey: 'test-uniswap-api-key',
}

function parseWebValues(values: Record<string, unknown>): Config {
  return parseConfig({ values, schema: webConfigSchema, envFieldRules: webEnvFieldRules })
}

/** parseConfig logs violations via console.error before throwing; silence it for the guard */
function expectParseToThrow(values: Record<string, unknown>, message: string): void {
  vi.spyOn(console, 'error').mockReturnValue()
  expect(() => parseWebValues(values)).toThrow(message)
}

describe('web envFieldRules', () => {
  // Representative fields only — one per rule kind; the full rule list lives
  // in webEnvFieldRules and the enforcement mechanism is tested in
  // @universe/config.
  it('rejects a dev-only field set in production', () => {
    expectParseToThrow(
      { ...baseValues, viteBackendUrl: 'http://localhost:8081' },
      'viteBackendUrl  Forbidden for environment "production"',
    )
  })

  it('rejects a required API key empty in production', () => {
    expectParseToThrow({ ...baseValues, statsigApiKey: '' }, 'statsigApiKey  Required for environment "production"')
  })

  it('accepts a representative production values map', () => {
    const config = parseWebValues(baseValues)

    expect(config.environment).toBe('production')
    expect(config.viteBackendUrl).toBeUndefined()
    expect(config.statsigApiKey).toBe('test-statsig-api-key')
  })

  it('leaves development unconstrained', () => {
    const config = parseWebValues({
      ...baseValues,
      environment: 'development',
      statsigApiKey: '',
      viteBackendUrl: 'http://localhost:8081',
    })

    expect(config.environment).toBe('development')
    expect(config.statsigApiKey).toBe('')
    expect(config.viteBackendUrl).toBe('http://localhost:8081')
  })

  // Pins the skipCsp carve-out: web e2e builds/previews run with ENVIRONMENT="production"
  // (apps/web/.env.e2e.override) while the e2e commands set SKIP_CSP and DISABLE_SOURCEMAP
  // (apps/web/project.json), so those fields must stay unconstrained.
  it('still parses the e2e env layering (ENVIRONMENT=production with SKIP_CSP set)', () => {
    const config = parseWebValues({
      ...baseValues,
      entryGatewayApiUrlOverride: '',
      skipCsp: '1',
      disableSourcemap: 'true',
      isE2ETest: 'true',
      ci: 'true',
    })

    expect(config.environment).toBe('production')
    expect(config.isE2ETest).toBe(true)
  })
})
