import { AppId, type BaseConfig, BaseConfigSchema, getConfig } from '@universe/config'
import { Environment, getCurrentEnv } from '@universe/environment'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getWebSocketUrl } from './getWebSocketUrl'

vi.mock('@universe/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/config')>()
  return {
    ...actual,
    getConfig: vi.fn(() => ({ appId: actual.AppId.Web })),
  }
})

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    getCurrentEnv: vi.fn(),
  }
})

const mockGetConfig = vi.mocked(getConfig)
const mockGetCurrentEnv = vi.mocked(getCurrentEnv)

const baseConfig = BaseConfigSchema.parse({ appId: AppId.Web, environment: Environment.Staging })

function setConfig(overrides: Partial<BaseConfig> = {}) {
  mockGetConfig.mockReturnValue({ ...baseConfig, ...overrides })
}

describe('getWebSocketUrl', () => {
  beforeEach(() => {
    setConfig({ enableEntryGatewayProxy: false })
    mockGetCurrentEnv.mockReturnValue(Environment.Staging)
  })

  it.each([
    [Environment.Development, 'wss://entry-gateway.backend-dev.api.uniswap.org/ws'],
    [Environment.Staging, 'wss://entry-gateway.backend-staging.api.uniswap.org/ws'],
    [Environment.Production, 'wss://entry-gateway.backend-prod.api.uniswap.org/ws'],
  ])('opens against the %s entry gateway', (environment, expected) => {
    mockGetCurrentEnv.mockReturnValue(environment)
    expect(getWebSocketUrl()).toBe(expected)
  })

  it('follows the entry gateway override so the socket shares the REST host and its session cookie', () => {
    setConfig({
      enableEntryGatewayProxy: false,
      entryGatewayApiUrlOverride: 'https://entry-gateway.api.corn-staging.com',
    })
    expect(getWebSocketUrl()).toBe('wss://entry-gateway.api.corn-staging.com/ws')
  })

  it('uses the same-origin proxy path when the proxy is enabled', () => {
    setConfig({ enableEntryGatewayProxy: true })
    expect(getWebSocketUrl()).toBe('/ws')
  })

  it('bypasses the proxy path on Vercel, which cannot forward a socket', () => {
    setConfig({ enableEntryGatewayProxy: true, isVercelEnvironment: true })
    expect(getWebSocketUrl()).toBe('wss://entry-gateway.backend-staging.api.uniswap.org/ws')
  })
})
