import type { FetchClient } from '@universe/api/src/clients/base/types'
import { createFetcher } from '@universe/api/src/clients/base/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('createFetcher', () => {
  const mockClient: FetchClient = {
    fetch: vi.fn().mockResolvedValue({ data: 'fetch' }),
    get: vi.fn().mockResolvedValue({ data: 'get' }),
    post: vi.fn().mockResolvedValue({ data: 'post' }),
    put: vi.fn().mockResolvedValue({ data: 'put' }),
    delete: vi.fn(),
    patch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a fetcher for FETCH requests', async () => {
    const fetcher = createFetcher<{ id: string }, { data: string }>({
      client: mockClient,
      method: 'fetch',
      url: '/api/test',
    })
    const result = await fetcher({ id: '123' })
    expect(result).toEqual({ data: 'fetch' })
  })

  it('should create a fetcher for GET requests', async () => {
    const fetcher = createFetcher<{ id: string }, { data: string }>({
      client: mockClient,
      method: 'get',
      url: '/api/test',
    })
    const result = await fetcher({ id: '123' })
    expect(result).toEqual({ data: 'get' })
  })

  it('should create a fetcher for POST requests', async () => {
    const fetcher = createFetcher<{ name: string }, { data: string }>({
      client: mockClient,
      method: 'post',
      url: '/api/create',
    })
    const result = await fetcher({ name: 'test' })
    expect(result).toEqual({ data: 'post' })
  })

  it('should apply transformRequest to modify url', async () => {
    const fetcher = createFetcher<{ id: string }, { data: string }>({
      client: mockClient,
      method: 'get',
      url: '/api/test',
      transformRequest: async ({ url }) => ({ url: `${url}/modified` }),
    })
    await fetcher({ id: '123' })
    expect(mockClient.get).toHaveBeenCalledWith(
      '/api/test/modified',
      expect.objectContaining({ params: { id: '123' } }),
    )
  })

  it('should apply transformRequest to modify headers', async () => {
    const fetcher = createFetcher<{ id: string }, { data: string }>({
      client: mockClient,
      method: 'get',
      url: '/api/test',
      transformRequest: async () => ({ headers: { Authorization: 'Bearer token' } }),
    })
    await fetcher({ id: '123' })
    expect(mockClient.get).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    )
  })

  it('should apply transformRequest to modify params', async () => {
    const fetcher = createFetcher<{ id: string }, { data: string }>({
      client: mockClient,
      method: 'get',
      url: '/api/test',
      transformRequest: async ({ params }) => ({ params: { ...params, extra: 'value' } }),
    })
    await fetcher({ id: '123' })
    expect(mockClient.get).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ params: { id: '123', extra: 'value' } }),
    )
  })

  it('should apply transformRequest to modify url, headers, and params together', async () => {
    const fetcher = createFetcher<{ id: string }, { data: string }>({
      client: mockClient,
      method: 'post',
      url: '/api/test',
      transformRequest: async ({ url, params }) => ({
        url: `${url}/v2`,
        headers: { 'X-Custom': 'header' },
        params: { ...params, version: 2 },
      }),
    })
    await fetcher({ id: '123' })
    expect(mockClient.post).toHaveBeenCalledWith('/api/test/v2', {
      headers: { 'X-Custom': 'header' },
      body: JSON.stringify({ id: '123', version: 2 }),
      on404: expect.any(Function),
    })
  })

  it('should apply transformResponse when provided', async () => {
    const fetcher = createFetcher<{ id: string }, { data: string }>({
      client: mockClient,
      method: 'get',
      url: '/api/test',
      transformResponse: (response) => ({ data: response.data.toUpperCase() }),
    })
    const result = await fetcher({ id: '123' })
    expect(result).toEqual({ data: 'GET' })
  })

  it('should support async transformResponse', async () => {
    const fetcher = createFetcher<{ id: string }, { data: string }>({
      client: mockClient,
      method: 'get',
      url: '/api/test',
      transformResponse: async (response) => ({ data: `transformed-${response.data}` }),
    })
    const result = await fetcher({ id: '123' })
    expect(result).toEqual({ data: 'transformed-get' })
  })
})
