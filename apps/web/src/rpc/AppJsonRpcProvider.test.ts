import { TransactionResponse } from '@ethersproject/abstract-provider'
import { JsonRpcProvider, Network, Provider } from '@ethersproject/providers'
import { ChainId } from '@uniswap/sdk-core'

import AppJsonRpcProvider from './AppJsonRpcProvider'

jest.mock('@ethersproject/providers')

describe('AppJsonRpcProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  let mockProviders: JsonRpcProvider[]
  let mockProvider1: jest.Mocked<JsonRpcProvider>
  let mockProvider2: jest.Mocked<JsonRpcProvider>
  let mockIsProvider: jest.SpyInstance

  beforeEach(() => {
    mockProvider1 = new JsonRpcProvider() as jest.Mocked<JsonRpcProvider>
    mockProvider2 = new JsonRpcProvider() as jest.Mocked<JsonRpcProvider>

    mockIsProvider = jest.spyOn(Provider, 'isProvider').mockReturnValue(true)
    mockProviders = [mockProvider1, mockProvider2]
    mockProviders.forEach((provider) => {
      // override readonly property
      // @ts-expect-error
      provider.network = {
        name: 'homestead',
        chainId: 1,
      } as Network
      provider.getNetwork = jest.fn().mockReturnValue({
        name: 'homestead',
        chainId: 1,
      } as Network)
      // override readonly property
      // @ts-expect-error
      provider.connection = { url: '' }
    })
  })

  it('constructor initializes with valid providers', () => {
    expect(() => new AppJsonRpcProvider(ChainId.MAINNET, mockProviders)).not.toThrow()
  })

  it('constructor throws with empty providers array', () => {
    expect(() => new AppJsonRpcProvider(ChainId.MAINNET, [])).toThrow('providers array empty')
  })

  it('constructor throws with network mismatch', () => {
    mockProviders[0].network.chainId = 2
    expect(() => new AppJsonRpcProvider(ChainId.MAINNET, mockProviders)).toThrow('networks mismatch')
  })

  it('constructor throws with invalid providers', () => {
    mockIsProvider.mockReturnValueOnce(false)
    expect(() => new AppJsonRpcProvider(ChainId.MAINNET, [{} as JsonRpcProvider])).toThrow('invalid provider')
  })

  it('handles and instruments call', async () => {
    const hash = '0x123'
    mockProvider1.perform.mockImplementation(async () => {
      jest.advanceTimersByTime(100)
      return { hash } as TransactionResponse
    })
    const provider = new AppJsonRpcProvider(ChainId.MAINNET, [mockProvider1])

    const { hash: result } = await provider.perform('call', [{ hash }])
    expect(result).toBe(hash)

    // Validate that the latency and callCount were incremented
    expect(provider.providerEvaluations[0].performance.latency).toBeGreaterThanOrEqual(100)
    expect(provider.providerEvaluations[0].performance.callCount).toBe(1)
  })

  it('should increment failureCount on provider failure', async () => {
    const hash = '0x123'
    mockProvider1.perform.mockRejectedValue(new Error('Failed'))
    const provider = new AppJsonRpcProvider(ChainId.MAINNET, mockProviders)
    const warn = jest.spyOn(console, 'warn').mockImplementation()

    await expect(provider.perform('call', [{ hash }])).rejects.toThrow()
    expect(warn).toHaveBeenCalled()

    // Validate that the failureCount and callCount were incremented
    expect(provider.providerEvaluations[0].performance.failureCount).toBe(1)
    expect(provider.providerEvaluations[0].performance.callCount).toBe(1)
  })

  it('should sort faster providers before slower providers', async () => {
    // Validate that the providers are sorted correctly by latency
    const [fastProvider, slowProvider] = AppJsonRpcProvider.sortProviders([
      { provider: {} as JsonRpcProvider, performance: { latency: 500, callCount: 1, failureCount: 0 } },
      { provider: {} as JsonRpcProvider, performance: { latency: 1, callCount: 1, failureCount: 0 } },
    ])

    expect(fastProvider.performance.latency).toBeLessThan(slowProvider.performance.latency)
  })

  it('should sort failing providers after successful providers', async () => {
    // Validate that the providers are sorted correctly by failure rate
    const [provider, failingProvider] = AppJsonRpcProvider.sortProviders([
      { provider: {} as JsonRpcProvider, performance: { latency: 1, callCount: 1, failureCount: 1 } },
      { provider: {} as JsonRpcProvider, performance: { latency: 1, callCount: 1, failureCount: 0 } },
    ])

    expect(provider.performance.failureCount).toBeLessThan(failingProvider.performance.failureCount)
  })
})
