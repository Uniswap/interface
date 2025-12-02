import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

vi.mock('@universe/config', () => ({
  getConfig: vi.fn(() => ({
    unitagsApiUrlOverride: undefined,
  })),
}))

vi.mock('@universe/api/src/clients/base/urls', () => ({
  getCloudflareApiBaseUrl: vi.fn(() => 'https://api.test.com'),
  TrafficFlows: {
    Unitags: 'unitags',
  },
}))

vi.mock('@universe/api/src/clients/base/createFetchClient', () => ({
  createFetchClient: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  })),
}))

vi.mock('@universe/api/src/clients/base/auth', () => ({
  createSignedRequestBody: vi.fn(),
  createSignedRequestParams: vi.fn(),
}))

vi.mock('@universe/api/src/clients/base/utils', () => ({
  createFetcher: vi.fn(),
}))

type FetcherConfig = {
  client: unknown
  method: string
  url: string
  transformRequest?: (args: { params: unknown; url: string }) => Promise<{
    url?: string
    headers?: HeadersInit
    params?: unknown
  }>
}

const mockFetchClient = {
  context: vi.fn(),
  fetch: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
}

// Import after mocks are set up
import { createSignedRequestBody, createSignedRequestParams } from '@universe/api/src/clients/base/auth'
import { createFetcher } from '@universe/api/src/clients/base/utils'

describe('UnitagsApiClient', () => {
  const mockCreateFetcher = createFetcher as unknown as Mock
  const mockCreateSignedRequestBody = createSignedRequestBody as unknown as Mock
  const mockCreateSignedRequestParams = createSignedRequestParams as unknown as Mock

  beforeEach(() => {
    vi.clearAllMocks()

    mockCreateSignedRequestBody.mockResolvedValue({
      requestBody: {
        test: 'data',
        'x-uni-address': '0x123',
        'x-uni-timestamp': 1234567890,
      } as any,
      signature: 'mock-signature',
    })

    mockCreateSignedRequestParams.mockResolvedValue({
      requestParams: {
        test: 'data',
        'x-uni-address': '0x123',
        'x-uni-timestamp': 1234567890,
      } as any,
      signature: 'mock-signature',
    })
  })

  describe('transformRequest functions', () => {
    let fetcherConfigs: FetcherConfig[]

    beforeEach(async () => {
      vi.resetModules()
      mockCreateFetcher.mockClear()
      const { createUnitagsApiClient } = await import('./createUnitagsApiClient')

      createUnitagsApiClient({ fetchClient: mockFetchClient })
      fetcherConfigs = mockCreateFetcher.mock.calls.map((call) => call[0] as FetcherConfig)
    })

    it('should not have transformRequest for fetchUnitagsByAddresses', async () => {
      const config = fetcherConfigs.find((c) => c.url === '/addresses')
      expect(config?.transformRequest).toBeUndefined()
    })

    it('should transform claimUnitag request with signature', async () => {
      const config = fetcherConfigs.find((c) => c.url === '/username' && c.method === 'post')
      expect(config?.transformRequest).toBeDefined()

      const params = {
        data: { username: 'testuser', deviceId: 'device123' },
        address: '0x123',
        signMessage: vi.fn().mockResolvedValue('mock-signature'),
      }

      const result = await config!.transformRequest!({
        url: '/username',
        params,
      })

      expect(mockCreateSignedRequestBody).toHaveBeenCalledWith({
        data: params.data,
        address: params.address,
        signMessage: params.signMessage,
      })

      expect(result).toEqual({
        params: {
          test: 'data',
          'x-uni-address': '0x123',
          'x-uni-timestamp': 1234567890,
        },
        headers: {
          'x-uni-sig': 'mock-signature',
        },
      })
    })

    it('should transform updateUnitagMetadata request with URL replacement', async () => {
      const config = fetcherConfigs.find((c) => c.url === '/username/:username/metadata')
      expect(config?.transformRequest).toBeDefined()

      const params = {
        username: 'testuser',
        data: { metadata: { description: 'updated' } },
        address: '0x123',
        signMessage: vi.fn().mockResolvedValue('mock-signature'),
      }

      const result = await config!.transformRequest!({
        url: '/username/:username/metadata',
        params,
      })

      expect(mockCreateSignedRequestBody).toHaveBeenCalledWith({
        data: params.data,
        address: params.address,
        signMessage: params.signMessage,
      })

      expect(result).toEqual({
        url: '/username/testuser/metadata',
        params: {
          test: 'data',
          'x-uni-address': '0x123',
          'x-uni-timestamp': 1234567890,
        },
        headers: {
          'x-uni-sig': 'mock-signature',
        },
      })
    })

    it('should transform changeUnitag request with signature', async () => {
      const config = fetcherConfigs.find((c) => c.url === '/username/change')
      expect(config?.transformRequest).toBeDefined()

      const params = {
        data: { newUsername: 'newuser' },
        address: '0x123',
        signMessage: vi.fn().mockResolvedValue('mock-signature'),
      }

      const result = await config!.transformRequest!({
        url: '/username/change',
        params,
      })

      expect(mockCreateSignedRequestBody).toHaveBeenCalledWith({
        data: params.data,
        address: params.address,
        signMessage: params.signMessage,
      })

      expect(result).toEqual({
        params: {
          test: 'data',
          'x-uni-address': '0x123',
          'x-uni-timestamp': 1234567890,
        },
        headers: {
          'x-uni-sig': 'mock-signature',
        },
      })
    })

    it('should transform deleteUnitag request with signature', async () => {
      const config = fetcherConfigs.find((c) => c.url === '/username' && c.method === 'delete')
      expect(config?.transformRequest).toBeDefined()

      const params = {
        data: { username: 'testuser' },
        address: '0x123',
        signMessage: vi.fn().mockResolvedValue('mock-signature'),
      }

      const result = await config!.transformRequest!({
        url: '/username',
        params,
      })

      expect(mockCreateSignedRequestBody).toHaveBeenCalledWith({
        data: params.data,
        address: params.address,
        signMessage: params.signMessage,
      })

      expect(result).toEqual({
        params: {
          test: 'data',
          'x-uni-address': '0x123',
          'x-uni-timestamp': 1234567890,
        },
        headers: {
          'x-uni-sig': 'mock-signature',
        },
      })
    })

    it('should transform getUnitagAvatarUploadUrl request with createSignedRequestParams', async () => {
      const config = fetcherConfigs.find((c) => c.url === '/username/avatar-upload-url')
      expect(config?.transformRequest).toBeDefined()

      const params = {
        data: { username: 'testuser' },
        address: '0x123',
        signMessage: vi.fn().mockResolvedValue('mock-signature'),
      }

      const result = await config!.transformRequest!({
        url: '/username/avatar-upload-url',
        params,
      })

      expect(mockCreateSignedRequestParams).toHaveBeenCalledWith({
        data: params.data,
        address: params.address,
        signMessage: params.signMessage,
      })

      expect(result).toEqual({
        params: {
          test: 'data',
          'x-uni-address': '0x123',
          'x-uni-timestamp': 1234567890,
        },
        headers: {
          'x-uni-sig': 'mock-signature',
        },
      })
    })
  })

  describe('client instance methods', () => {
    let mockFetchers: Record<string, Mock>

    beforeEach(() => {
      mockFetchers = {}
      mockCreateFetcher.mockImplementation((config: any) => {
        const key = `${config.method}-${config.url}`
        const fetcher = vi.fn()
        mockFetchers[key] = fetcher
        return fetcher as any
      })
    })

    it('should create client with all fetcher functions', async () => {
      vi.resetModules()
      mockCreateFetcher.mockClear()
      const { createUnitagsApiClient } = await import('./createUnitagsApiClient')
      const client = createUnitagsApiClient({ fetchClient: mockFetchClient })

      expect(client.fetchUsername).toBeDefined()
      expect(client.fetchAddress).toBeDefined()
      expect(client.fetchUnitagsByAddresses).toBeDefined()
      expect(client.fetchClaimEligibility).toBeDefined()
      expect(client.claimUnitag).toBeDefined()
      expect(client.updateUnitagMetadata).toBeDefined()
      expect(client.changeUnitag).toBeDefined()
      expect(client.deleteUnitag).toBeDefined()
      expect(client.getUnitagAvatarUploadUrl).toBeDefined()
    })

    it('should call the correct fetcher when using client methods', async () => {
      // Clear and reset mocks
      vi.resetModules()
      vi.clearAllMocks()
      mockFetchers = {}

      // Mock implementation that stores fetchers
      mockCreateFetcher.mockImplementation((config: any) => {
        const key = `${config.method}-${config.url}`
        const fetcher = vi.fn()
        mockFetchers[key] = fetcher
        return fetcher as any
      })

      const { createUnitagsApiClient } = await import('./createUnitagsApiClient')
      const client = createUnitagsApiClient({ fetchClient: mockFetchClient })

      // Ensure the fetcher was created
      expect(mockFetchers['get-/username']).toBeDefined()

      // Test fetchUsername
      const usernameResponse = { username: 'test', address: '0x123' }
      mockFetchers['get-/username']?.mockResolvedValue(usernameResponse)

      const result = await client.fetchUsername({ username: 'test' })
      expect(mockFetchers['get-/username']).toHaveBeenCalledWith({ username: 'test' })
      expect(result).toEqual(usernameResponse)
    })
  })
})
