import { JsonRpcProvider, Network, Provider } from '@ethersproject/providers'

import AppRpcProvider from './appRpcProvider'

jest.mock('@ethersproject/providers')

describe('AppRpcProvider', () => {
  let mockProviders: JsonRpcProvider[]
  let mockIsProvider: jest.SpyInstance

  beforeEach(() => {
    mockIsProvider = jest.spyOn(Provider, 'isProvider').mockImplementation(() => true)
    mockProviders = [new JsonRpcProvider(), new JsonRpcProvider(), new JsonRpcProvider()]
    mockProviders.forEach((provider, i) => {
      // override readonly property
      // @ts-expect-error
      provider.network = {
        name: 'homestead',
        chainId: 1,
      } as Network

      provider.getBlockNumber = jest.fn().mockResolvedValue(100 + i)
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
    const provider = new AppRpcProvider(mockProviders)
    const mockTxHash = '0x123'
    mockProviders.forEach((provider) => {
      provider.sendTransaction = jest.fn().mockResolvedValue({ hash: mockTxHash })
    })

    const result = await provider.perform('sendTransaction', { signedTransaction: '0xabc' })
    expect(result).toBe(mockTxHash)
  })
})
