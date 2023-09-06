import { TransactionResponse } from '@ethersproject/abstract-provider'
import { JsonRpcProvider, Network, Provider } from '@ethersproject/providers'

import AppRpcProvider from './appRpcProvider'

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
    })
  })

  test('constructor initializes with valid providers', () => {
    expect(() => new AppRpcProvider(mockProviders)).not.toThrow()
  })

  test('constructor throws with empty providers array', () => {
    expect(() => new AppRpcProvider([])).toThrow('providers array empty')
  })

  test('constructor throws with network mismatch', () => {
    mockProviders[0].network.chainId = 2
    expect(() => new AppRpcProvider(mockProviders)).toThrow('networks mismatch')
  })

  test('constructor throws with invalid providers', () => {
    mockIsProvider.mockReturnValueOnce(false)
    expect(() => new AppRpcProvider([{} as JsonRpcProvider])).toThrow('invalid provider')
  })

  test('handles sendTransaction', async () => {
    const hash = '0x123'
    mockProvider1.sendTransaction.mockResolvedValue({ hash } as TransactionResponse)
    const provider = new AppRpcProvider([mockProvider1])

    const result = await provider.perform('sendTransaction', { signedTransaction: '0xabc' })
    expect(result).toBe(hash)
  })

  test('should sort faster providers before slower providers', async () => {
    const SLOW = 100
    mockProvider1.getBlockNumber = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve(1), SLOW)))

    const FAST = 10
    mockProvider2.getBlockNumber = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve(1), FAST)))

    const appRpcProvider = new AppRpcProvider(mockProviders)

    // Evaluate all providers
    const evaluationPromises = appRpcProvider.providerEvaluations.map(appRpcProvider.evaluateProvider)
    await Promise.all(evaluationPromises)

    // Validate that the providers are sorted correctly by latency
    const [fastProvider, slowProvider] = AppRpcProvider.sortProviders(appRpcProvider.providerEvaluations.slice())

    expect(fastProvider.performance.latency).toBeLessThan(slowProvider.performance.latency)
    mockProvider1.getBlockNumber.mockRestore()
    mockProvider2.getBlockNumber.mockRestore()
  })

  test('should sort failing providers after successful providers', async () => {
    mockProvider1.getBlockNumber = jest.fn(
      () => new Promise((_resolve, reject) => setTimeout(() => reject('fail'), 100))
    )
    mockProvider2.getBlockNumber = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve(1), 100)))

    const appRpcProvider = new AppRpcProvider(mockProviders)

    // Evaluate all providers
    const evaluationPromises = appRpcProvider.providerEvaluations.map(appRpcProvider.evaluateProvider)
    await Promise.all(evaluationPromises)

    // Validate that the providers are sorted correctly by latency
    const [provider, failingProvider] = AppRpcProvider.sortProviders(appRpcProvider.providerEvaluations.slice())
    expect(provider.performance.failureRate).toBeLessThan(failingProvider.performance.failureRate)
    mockProvider1.getBlockNumber.mockRestore()
    mockProvider2.getBlockNumber.mockRestore()
  })

  test('should increment failureRate on provider failure', async () => {
    mockProvider1.getBlockNumber.mockRejectedValue(new Error('Failed'))

    const appRpcProvider = new AppRpcProvider(mockProviders)

    // Evaluate the failing provider
    await appRpcProvider.evaluateProvider(appRpcProvider.providerEvaluations[0])

    // Validate that the failureRate was incremented
    expect(appRpcProvider.providerEvaluations[0].performance.failureRate).toBe(1)
    mockProvider1.getBlockNumber.mockRestore()
  })
})
