import {
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
} from '@universe/api/src/clients/base/urls'
import { getConfig } from '@universe/config'
import { Environment, getCurrentEnv } from '@universe/environment'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ENTRY_GATEWAY_PROXY_PATH, getEntryGatewayUrl } from './getEntryGatewayUrl'

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

interface MockConfig {
  entryGatewayApiUrlOverride?: string
  enableEntryGatewayProxy?: boolean
  isVercelEnvironment?: boolean
}

function setConfig(overrides: MockConfig = {}) {
  mockGetConfig.mockReturnValue({
    entryGatewayApiUrlOverride: '',
    enableEntryGatewayProxy: false,
    isVercelEnvironment: false,
    ...overrides,
  })
}

describe('getEntryGatewayUrl', () => {
  beforeEach(() => {
    setConfig()
    mockGetCurrentEnv.mockReturnValue(Environment.Staging)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('proxy disabled', () => {
    it('returns the URL for the current env when no override is given', () => {
      mockGetCurrentEnv.mockReturnValue(Environment.Production)
      expect(getEntryGatewayUrl()).toBe(PROD_ENTRY_GATEWAY_API_BASE_URL)
    })

    it('forces the prod URL when env is pinned to PROD even from staging', () => {
      mockGetCurrentEnv.mockReturnValue(Environment.Staging)
      expect(getEntryGatewayUrl({ env: Environment.Production })).toBe(PROD_ENTRY_GATEWAY_API_BASE_URL)
    })

    it('returns staging URL for both DEV and STAGING current envs', () => {
      mockGetCurrentEnv.mockReturnValue(Environment.Development)
      expect(getEntryGatewayUrl()).toBe(STAGING_ENTRY_GATEWAY_API_BASE_URL)

      mockGetCurrentEnv.mockReturnValue(Environment.Staging)
      expect(getEntryGatewayUrl()).toBe(STAGING_ENTRY_GATEWAY_API_BASE_URL)
    })
  })

  describe('proxy enabled', () => {
    beforeEach(() => {
      setConfig({ enableEntryGatewayProxy: true })
    })

    it('returns the bare proxy path when no env is pinned', () => {
      expect(getEntryGatewayUrl()).toBe(ENTRY_GATEWAY_PROXY_PATH)
    })

    it('returns an env-suffixed proxy path so the BFF can route to that env', () => {
      expect(getEntryGatewayUrl({ env: Environment.Production })).toBe(`${ENTRY_GATEWAY_PROXY_PATH}/prod`)
      expect(getEntryGatewayUrl({ env: Environment.Staging })).toBe(`${ENTRY_GATEWAY_PROXY_PATH}/staging`)
      expect(getEntryGatewayUrl({ env: Environment.Development })).toBe(`${ENTRY_GATEWAY_PROXY_PATH}/dev`)
    })

    it('prefers the proxy path over direct backend overrides for default traffic', () => {
      setConfig({
        entryGatewayApiUrlOverride: 'https://entry-gateway.api.corn-staging.com',
        enableEntryGatewayProxy: true,
      })
      expect(getEntryGatewayUrl()).toBe(ENTRY_GATEWAY_PROXY_PATH)
      expect(getCurrentEnv).not.toHaveBeenCalled()
    })
  })

  describe('explicit override', () => {
    it('honors entryGatewayApiUrlOverride for default (non-env-pinned) calls when proxying is disabled', () => {
      setConfig({
        entryGatewayApiUrlOverride: 'https://example.test',
        enableEntryGatewayProxy: false,
      })
      expect(getEntryGatewayUrl()).toBe('https://example.test')
    })

    it('bypasses the override when env is pinned, so unitags-style services still hit the right backend', () => {
      // Reproduces INFRA-1798's staging-preview regression: with
      // ENTRY_GATEWAY_API_URL_OVERRIDE set (e.g. corn-staging) and the
      // proxy enabled, env-pinned calls (`{ env: PROD }`) used to silently
      // return the override and route prod traffic to staging.
      setConfig({
        entryGatewayApiUrlOverride: 'https://entry-gateway.api.corn-staging.com',
        enableEntryGatewayProxy: true,
      })
      expect(getEntryGatewayUrl({ env: Environment.Production })).toBe(`${ENTRY_GATEWAY_PROXY_PATH}/prod`)
      expect(getEntryGatewayUrl({ env: Environment.Staging })).toBe(`${ENTRY_GATEWAY_PROXY_PATH}/staging`)
    })

    it('bypasses the override when env is pinned, even with proxy disabled', () => {
      setConfig({ entryGatewayApiUrlOverride: 'https://example.test' })
      expect(getEntryGatewayUrl({ env: Environment.Production })).toBe(PROD_ENTRY_GATEWAY_API_BASE_URL)
    })
  })
})
