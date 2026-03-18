import { Signer } from '@ethersproject/abstract-signer'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ConnectionInfo, fetchJson } from '@ethersproject/web'
import { FlashbotsRpcProvider } from 'uniswap/src/features/providers/FlashbotsRpcProvider'
import type { Mock, Mocked } from 'vitest'

vi.mock('@ethersproject/web', () => ({
  fetchJson: vi.fn(),
}))

// Mock resolveProperties to properly resolve nested promises like the real implementation
vi.mock('@ethersproject/properties', () => ({
  resolveProperties: vi.fn().mockImplementation(async (input: Record<string, unknown>) => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input)) {
      result[key] = await value
    }
    return result
  }),
}))

const mockFetchJson = fetchJson as Mock
const testAddress = '0xF570F45f598fD48AF83FABD692629a2caFe899ec'

describe('FlashbotsRpcProvider', () => {
  let mockSigner: Mocked<Signer>
  let provider: FlashbotsRpcProvider
  let superGetTransactionCountSpy: any = null

  beforeEach(() => {
    vi.clearAllMocks()
    mockSigner = {
      getAddress: vi.fn().mockResolvedValue(testAddress),
      signMessage: vi.fn().mockResolvedValue('0xsignature'),
    } as unknown as Mocked<Signer>
    provider = new FlashbotsRpcProvider({ signerInfo: { signer: mockSigner, address: testAddress } })
  })

  afterEach(() => {
    // Restore any spies we created
    superGetTransactionCountSpy?.mockRestore()
    superGetTransactionCountSpy = null
  })

  describe('getTransactionCount', () => {
    it('should use super.getTransactionCount for non-pending blocks', async () => {
      superGetTransactionCountSpy = vi.spyOn(JsonRpcProvider.prototype, 'getTransactionCount')
      superGetTransactionCountSpy.mockResolvedValue(5)

      const result = await provider.getTransactionCount(testAddress, 'latest')

      expect(result).toBe(5)
      expect(superGetTransactionCountSpy).toHaveBeenCalled()
    })

    it('should use super.getTransactionCount for other addresses', async () => {
      superGetTransactionCountSpy = vi.spyOn(JsonRpcProvider.prototype, 'getTransactionCount')
      superGetTransactionCountSpy.mockResolvedValue(11)

      const result = await provider.getTransactionCount('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 'latest')

      expect(result).toBe(11)
      expect(superGetTransactionCountSpy).toHaveBeenCalled()
    })

    it('should use authenticated request for pending blocks', async () => {
      mockFetchJson.mockImplementation((connection: ConnectionInfo, request: string) => {
        const parsedRequest = JSON.parse(request)
        if (parsedRequest.method === 'eth_chainId') {
          return Promise.resolve(0x1)
        } else if (parsedRequest.method === 'eth_getTransactionCount') {
          expect(connection.headers?.['X-Flashbots-Signature']).toBe(`${testAddress}:0xsignature`)
          return Promise.resolve(0x3)
        }
        return undefined
      })

      const result = await provider.getTransactionCount(testAddress, 'pending')

      expect(result).toBe(3)
      expect(mockSigner.signMessage).toHaveBeenCalled()
    })

    it('should throw an error if the response contains an error', async () => {
      mockFetchJson.mockResolvedValue({ error: { message: 'Test error', code: 123 } })

      await expect(provider.getTransactionCount(testAddress, 'pending')).rejects.toThrow('Test error')
    })
  })
})
