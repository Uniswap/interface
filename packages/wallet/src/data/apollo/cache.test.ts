import { InMemoryCache } from '@apollo/client'
import { persistCache } from 'apollo3-cache-persist'
import { PersistentStorage } from 'apollo3-cache-persist/lib/types'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'
import { initAndPersistCache, shouldResetCache, storeCacheVersion } from 'wallet/src/data/apollo/cache'

// Mock external dependencies
jest.mock('@apollo/client')
jest.mock('apollo3-cache-persist')
jest.mock('uniswap/src/data/cache')
jest.mock('utilities/src/logger/logger')

const mockPersistCache = persistCache as jest.MockedFunction<typeof persistCache>
const mockSetupSharedApolloCache = setupSharedApolloCache as jest.MockedFunction<typeof setupSharedApolloCache>

describe('shouldResetCache', () => {
  let mockCache: jest.Mocked<InMemoryCache>

  beforeEach(() => {
    mockCache = {
      readQuery: jest.fn(),
    } as never
  })

  it('returns true when no version is stored', () => {
    mockCache.readQuery.mockReturnValue(null)

    const result = shouldResetCache(mockCache)

    expect(result).toBe(true)
  })

  it('returns true when stored version differs from current', () => {
    mockCache.readQuery.mockReturnValue({
      apolloCacheVersion: '0',
    })

    const result = shouldResetCache(mockCache)

    expect(result).toBe(true)
  })

  it('returns false when versions match', () => {
    mockCache.readQuery.mockReturnValue({
      apolloCacheVersion: '1',
    })

    const result = shouldResetCache(mockCache)

    expect(result).toBe(false)
  })

  it('returns true when cache.readQuery throws error', () => {
    mockCache.readQuery.mockImplementation(() => {
      throw new Error('Cache read failed')
    })

    const result = shouldResetCache(mockCache)

    expect(result).toBe(true)
  })
})

describe('storeCacheVersion', () => {
  let mockCache: jest.Mocked<InMemoryCache>

  beforeEach(() => {
    mockCache = {
      writeQuery: jest.fn(),
    } as never
  })

  it('stores version in cache', () => {
    storeCacheVersion(mockCache)

    expect(mockCache.writeQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          apolloCacheVersion: '1',
        },
      }),
    )
  })

  it('handles writeQuery errors gracefully', () => {
    mockCache.writeQuery.mockImplementation(() => {
      throw new Error('Write failed')
    })

    expect(() => storeCacheVersion(mockCache)).not.toThrow()
  })
})

describe('initAndPersistCache', () => {
  let mockCache: jest.Mocked<InMemoryCache>
  let mockStorage: PersistentStorage<string>

  beforeEach(() => {
    jest.clearAllMocks()

    mockCache = {
      readQuery: jest.fn(),
      writeQuery: jest.fn(),
      reset: jest.fn(),
    } as never

    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    } as never

    mockSetupSharedApolloCache.mockReturnValue(mockCache)
    mockPersistCache.mockResolvedValue()
    mockCache.reset.mockResolvedValue()
  })

  it('returns cache instance', async () => {
    mockCache.readQuery.mockReturnValue({
      apolloCacheVersion: '1',
    })

    const result = await initAndPersistCache({
      storage: mockStorage,
      maxCacheSizeInBytes: 1000,
    })

    expect(result).toBe(mockCache)
  })

  it('resets cache when version check fails', async () => {
    mockCache.readQuery.mockReturnValue(null)

    await initAndPersistCache({
      storage: mockStorage,
      maxCacheSizeInBytes: 1000,
    })

    expect(mockCache.reset).toHaveBeenCalled()
  })

  it('does not reset cache when versions match', async () => {
    mockCache.readQuery.mockReturnValue({
      apolloCacheVersion: '1',
    })

    await initAndPersistCache({
      storage: mockStorage,
      maxCacheSizeInBytes: 1000,
    })

    expect(mockCache.reset).not.toHaveBeenCalled()
  })

  it('stores version after initialization', async () => {
    mockCache.readQuery.mockReturnValue({
      apolloCacheVersion: '1',
    })

    await initAndPersistCache({
      storage: mockStorage,
      maxCacheSizeInBytes: 1000,
    })

    expect(mockCache.writeQuery).toHaveBeenCalled()
  })

  it('handles persistCache errors', async () => {
    mockPersistCache.mockRejectedValue(new Error('Persist failed'))
    mockCache.readQuery.mockReturnValue({
      apolloCacheVersion: '1',
    })

    const result = await initAndPersistCache({
      storage: mockStorage,
      maxCacheSizeInBytes: 1000,
    })

    expect(result).toBe(mockCache)
  })
})
