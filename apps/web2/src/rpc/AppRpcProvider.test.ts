import { TransactionResponse } from '@ethersproject/abstract-provider'
import { JsonRpcProvider, Network, Provider } from '@ethersproject/providers'
import { ChainId } from '@uniswap/sdk-core'

import AppRpcProvider from './AppRpcProvider'

jest.mock('@ethersproject/providers')

describe('AppRpcProvider', () => {
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

  test('constructor initializes with valid providers', () => {
    expect(() => new AppRpcProvider(ChainId.MAINNET, mockProviders)).not.toThrow()
  })

  test('constructor throws with empty providers array', () => {
    expect(() => new AppRpcProvider(ChainId.MAINNET, [])).toThrow('providers array empty')
  })

  test('constructor throws with network mismatch', () => {
    mockProviders[0].network.chainId = 2
    expect(() => new AppRpcProvider(ChainId.MAINNET, mockProviders)).toThrow('networks mismatch')
  })

  test('constructor throws with invalid providers', () => {
    mockIsProvider.mockReturnValueOnce(false)
    expect(() => new AppRpcProvider(ChainId.MAINNET, [{} as JsonRpcProvider])).toThrow('invalid provider')
  })

  test('handles sendTransaction', async () => {
    const hash = '0x123'
    mockProvider1.sendTransaction.mockResolvedValue({ hash } as TransactionResponse)
    const provider = new AppRpcProvider(ChainId.MAINNET, [mockProvider1])

    const result = await provider.perform('sendTransaction', { signedTransaction: '0xabc' })
    expect(result).toBe(hash)
  })

  test('handles call', async () => {
    const hash = '0x123'
    mockProvider1.perform.mockResolvedValue({ hash } as TransactionResponse)
    const provider = new AppRpcProvider(ChainId.MAINNET, [mockProvider1])

    const { hash: result } = await provider.perform('call', [{ hash }])
    expect(result).toBe(hash)
  })

  test('should sort faster providers before slower providers', async () => {
    const SLOW = 500
    mockProvider1.getBlockNumber = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve(1), SLOW)))

    const FAST = 1
    mockProvider2.getBlockNumber = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve(1), FAST)))

    const appRpcProvider = new AppRpcProvider(ChainId.MAINNET, mockProviders)

    // Evaluate all providers
    const evaluationPromises = appRpcProvider.providerEvaluations.map(appRpcProvider.evaluateProvider)
    await Promise.all(evaluationPromises)

    // Validate that the providers are sorted correctly by latency
    const [fastProvider, slowProvider] = AppRpcProvider.sortProviders(appRpcProvider.providerEvaluations.slice())

    expect(fastProvider.performance.latency).toBeLessThan(slowProvider.performance.latency)
  })

  test('should sort failing providers after successful providers', async () => {
    mockProvider1.getBlockNumber = jest.fn(
      () => new Promise((_resolve, reject) => setTimeout(() => reject('fail'), 50))
    )
    mockProvider2.getBlockNumber = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve(1), 50)))

    const appRpcProvider = new AppRpcProvider(ChainId.MAINNET, mockProviders)

    // Evaluate all providers
    const evaluationPromises = appRpcProvider.providerEvaluations.map(appRpcProvider.evaluateProvider)
    await Promise.all(evaluationPromises)

    // Validate that the providers are sorted correctly by latency
    const [provider, failingProvider] = AppRpcProvider.sortProviders(appRpcProvider.providerEvaluations.slice())
    expect(provider.performance.failureCount).toBeLessThan(failingProvider.performance.failureCount)
  })

  test('should increment failureCount on provider failure', async () => {
    mockProvider1.getBlockNumber.mockRejectedValue(new Error('Failed'))

    const appRpcProvider = new AppRpcProvider(ChainId.MAINNET, mockProviders)

    // Evaluate the failing provider
    await appRpcProvider.evaluateProvider(appRpcProvider.providerEvaluations[0])

    // Validate that the failureCount was incremented
    expect(appRpcProvider.providerEvaluations[0].performance.failureCount).toBe(1)
  })
})
