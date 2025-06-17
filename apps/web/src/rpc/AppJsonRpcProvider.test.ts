import { JsonRpcProvider } from '@ethersproject/providers'
import * as matchers from 'jest-extended'
import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'
import type { Mocked } from 'vitest'

expect.extend(matchers)

vi.mock('@ethersproject/providers')

describe('AppJsonRpcProvider', () => {
  let mockProviders: JsonRpcProvider[]
  let mockProvider1: Mocked<JsonRpcProvider>
  let mockProvider2: Mocked<JsonRpcProvider>

  beforeEach(() => {
    mockProvider1 = vi.mocked(new JsonRpcProvider())
    mockProvider2 = vi.mocked(new JsonRpcProvider())
    mockProviders = [mockProvider1, mockProvider2]
    mockProviders.forEach((mockProvider) => {
      // Mocked modules are referentially equal, so we disambiguate the methods under test.
      mockProvider.perform = vi.fn()
    })

    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('constructor initializes with valid providers', () => {
    expect(() => new AppJsonRpcProvider(mockProviders)).not.toThrow()
  })

  it('constructor throws with no providers', () => {
    expect(() => new AppJsonRpcProvider([])).toThrow('Missing providers')
  })

  it('should try the first provider first', async () => {
    const provider = new AppJsonRpcProvider(mockProviders)
    await provider.perform('call', { transaction: {} })
    expect(mockProvider1.perform).toHaveBeenCalled()
    expect(mockProvider2.perform).not.toHaveBeenCalled()
  })

  it('should try the second provider after the first provider failed', async () => {
    const provider = new AppJsonRpcProvider(mockProviders)
    mockProvider1.perform.mockRejectedValue(new Error('Failed'))
    await provider.perform('call', { transaction: {} })
    expect(mockProvider2.perform).toHaveBeenCalledAfter(mockProvider1.perform as any)
  })

  it('should resume trying all providers in order after all have failed', async () => {
    const provider = new AppJsonRpcProvider(mockProviders)
    mockProvider1.perform.mockRejectedValue(new Error('Failed'))
    mockProvider2.perform.mockRejectedValueOnce(new Error('Failed'))
    await expect(provider.perform('call', { transaction: {} })).toReject()

    mockProviders.forEach((mockProvider) => vi.mocked(mockProvider.perform).mockClear())
    await provider.perform('call', { transaction: {} })
    expect(mockProvider2.perform).toHaveBeenCalledAfter(mockProvider1.perform as any)
  })

  it('should try the second provider first if the first provider has recently failed', async () => {
    const provider = new AppJsonRpcProvider(mockProviders)
    mockProvider1.perform.mockRejectedValue(new Error('Failed'))
    await provider.perform('call', { transaction: {} })

    mockProviders.forEach((mockProvider) => vi.mocked(mockProvider.perform).mockClear())
    await provider.perform('call', { transaction: {} })
    expect(mockProvider1.perform).not.toHaveBeenCalled()
    expect(mockProvider2.perform).toHaveBeenCalled()
  })

  describe('exponential backoff', () => {
    beforeAll(() => vi.useFakeTimers())
    afterAll(() => vi.useRealTimers())

    it('should retry the first provider after exponential backoff', async () => {
      const provider = new AppJsonRpcProvider(mockProviders, { minimumBackoffTime: 1 })
      mockProvider1.perform.mockRejectedValue(new Error('Failed'))
      await provider.perform('call', { transaction: {} })
      expect(mockProvider2.perform).toHaveBeenCalledAfter(mockProvider1.perform as any)

      for (let backoffTime = 1; backoffTime < 10; backoffTime *= 2) {
        for (let i = 0; i < backoffTime; i++) {
          // Ensure that mockProvider1 remains disabled for all of backoffTime.
          mockProviders.forEach((mockProvider) => vi.mocked(mockProvider.perform).mockClear())
          await provider.perform('call', { transaction: {} })
          expect(mockProvider1.perform).not.toHaveBeenCalled()
          expect(mockProvider2.perform).toHaveBeenCalled()
          vi.advanceTimersByTime(1)
        }

        // Ensure that after backoffTime, mockProvider1 is no longer disabled.
        mockProviders.forEach((mockProvider) => vi.mocked(mockProvider.perform).mockClear())
        await provider.perform('call', { transaction: {} })
        expect(mockProvider2.perform).toHaveBeenCalledAfter(mockProvider1.perform as any)
      }
    })
  })
})
