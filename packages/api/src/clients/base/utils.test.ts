import type { FetchClient } from '@universe/api/src/clients/base/types'
import { createFetcher } from '@universe/api/src/clients/base/utils'
import { describe, expect, it, vi } from 'vitest'

describe('createFetcher', () => {
  const mockClient: FetchClient = {
    fetch: vi.fn().mockResolvedValue({ data: 'fetch' }),
    get: vi.fn().mockResolvedValue({ data: 'get' }),
    post: vi.fn().mockResolvedValue({ data: 'post' }),
    put: vi.fn().mockResolvedValue({ data: 'put' }),
    delete: vi.fn(),
    patch: vi.fn(),
  }

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
})
