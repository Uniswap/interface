import { createFetcher, createSignedRequestBody, createSignedRequestParams } from '@universe/api'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

vi.mock('@universe/api', () => ({
  createFetchClient: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  })),
  createFetcher: vi.fn(),
  createSignedRequestBody: vi.fn(),
  createSignedRequestParams: vi.fn(),
}))

type FetcherConfig = {
  client: unknown
  method: string
  url: string
  transformRequest?: (
    params: unknown,
    url: string,
  ) => Promise<{
    url?: string
    headers?: HeadersInit
    params?: unknown
  }>
}

describe('UnitagsApiClient', () => {
  const mockCreateFetcher = vi.mocked(createFetcher)
  const mockCreateSignedRequestBody = vi.mocked(createSignedRequestBody)
  const mockCreateSignedRequestParams = vi.mocked(createSignedRequestParams)

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

  describe('createUnitagsApiClient', () => {
    it('should create fetchers for all endpoints', async () => {
      mockCreateFetcher.mockClear()

      const { createUnitagsApiClient } = await import('./UnitagsApiClient')
      createUnitagsApiClient()

      expect(mockCreateFetcher).toHaveBeenCalledTimes(9)

      const calls = mockCreateFetcher.mock.calls

      // fetchUsername
      expect(calls).toContainEqual([
        expect.objectContaining({
          method: 'get',
          url: '/username',
        }),
      ])

      // fetchAddress
      expect(calls).toContainEqual([
        expect.objectContaining({
          method: 'get',
          url: '/address',
        }),
      ])

      // fetchUnitagsByAddresses
      expect(calls).toContainEqual([
        expect.objectContaining({
          method: 'get',
          url: '/addresses',
          transformRequest: expect.any(Function),
        }),
      ])

      // fetchClaimEligibility
      expect(calls).toContainEqual([
        expect.objectContaining({
          method: 'get',
          url: '/claim/eligibility',
        }),
      ])

      // claimUnitag
      expect(calls).toContainEqual([
        expect.objectContaining({
          method: 'post',
          url: '/username',
          transformRequest: expect.any(Function),
        }),
      ])

      // updateUnitagMetadata
      expect(calls).toContainEqual([
        expect.objectContaining({
          method: 'put',
          url: '/username/:username/metadata',
          transformRequest: expect.any(Function),
        }),
      ])

      // changeUnitag
      expect(calls).toContainEqual([
        expect.objectContaining({
          method: 'post',
          url: '/username/change',
          transformRequest: expect.any(Function),
        }),
      ])

      // deleteUnitag
      expect(calls).toContainEqual([
        expect.objectContaining({
          method: 'delete',
          url: '/username',
          transformRequest: expect.any(Function),
        }),
      ])

      // getUnitagAvatarUploadUrl
      expect(calls).toContainEqual([
        expect.objectContaining({
          method: 'get',
          url: '/username/avatar-upload-url',
          transformRequest: expect.any(Function),
        }),
      ])
    })
  })

  describe('transformRequest functions', () => {
    let fetcherConfigs: FetcherConfig[]

    beforeEach(async () => {
      mockCreateFetcher.mockClear()
      const { createUnitagsApiClient } = await import('./UnitagsApiClient')
      createUnitagsApiClient({ baseUrl: 'https://api.test.com' })
      fetcherConfigs = mockCreateFetcher.mock.calls.map((call) => call[0] as FetcherConfig)
    })

    it('should transform fetchUnitagsByAddresses request correctly', async () => {
      const config = fetcherConfigs.find((c) => c.url === '/addresses')
      expect(config?.transformRequest).toBeDefined()

      const params = { addresses: ['0x123', '0x456', '0x789'] }
      const result = await config!.transformRequest!(params, '/addresses')

      expect(result).toEqual({
        url: '/addresses?addresses=0x123%2C0x456%2C0x789',
      })
    })

    it('should transform claimUnitag request with signature', async () => {
      const config = fetcherConfigs.find((c) => c.url === '/username' && c.method === 'post')
      expect(config?.transformRequest).toBeDefined()

      const params = {
        data: { username: 'testuser', deviceId: 'device123' },
        address: '0x123',
        signMessage: vi.fn().mockResolvedValue('mock-signature'),
      }

      const result = await config!.transformRequest!(params, '')

      expect(mockCreateSignedRequestBody).toHaveBeenCalledWith({
        data: params.data,
        address: params.address,
        signMessage: params.signMessage,
      })

      expect(result).toEqual({
        params: JSON.stringify({
          test: 'data',
          'x-uni-address': '0x123',
          'x-uni-timestamp': 1234567890,
        }),
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

      const result = await config!.transformRequest!(params, '/username/:username/metadata')

      expect(mockCreateSignedRequestBody).toHaveBeenCalledWith({
        data: params.data,
        address: params.address,
        signMessage: params.signMessage,
      })

      expect(result).toEqual({
        url: '/username/testuser/metadata',
        params: JSON.stringify({
          test: 'data',
          'x-uni-address': '0x123',
          'x-uni-timestamp': 1234567890,
        }),
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

      const result = await config!.transformRequest!(params, '')

      expect(mockCreateSignedRequestBody).toHaveBeenCalledWith({
        data: params.data,
        address: params.address,
        signMessage: params.signMessage,
      })

      expect(result).toEqual({
        params: JSON.stringify({
          test: 'data',
          'x-uni-address': '0x123',
          'x-uni-timestamp': 1234567890,
        }),
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

      const result = await config!.transformRequest!(params, '')

      expect(mockCreateSignedRequestBody).toHaveBeenCalledWith({
        data: params.data,
        address: params.address,
        signMessage: params.signMessage,
      })

      expect(result).toEqual({
        params: JSON.stringify({
          test: 'data',
          'x-uni-address': '0x123',
          'x-uni-timestamp': 1234567890,
        }),
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

      const result = await config!.transformRequest!(params, '')

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
      const { createUnitagsApiClient } = await import('./UnitagsApiClient')
      const client = createUnitagsApiClient({ baseUrl: 'https://api.test.com' })

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
      vi.clearAllMocks()
      mockFetchers = {}

      // Mock implementation that stores fetchers
      mockCreateFetcher.mockImplementation((config: any) => {
        const key = `${config.method}-${config.url}`
        const fetcher = vi.fn()
        mockFetchers[key] = fetcher
        return fetcher as any
      })

      const { createUnitagsApiClient } = await import('./UnitagsApiClient')
      const client = createUnitagsApiClient({ baseUrl: 'https://api.test.com' })

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
