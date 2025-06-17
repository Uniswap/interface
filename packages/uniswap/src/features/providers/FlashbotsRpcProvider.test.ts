import { Signer } from '@ethersproject/abstract-signer'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ConnectionInfo } from '@ethersproject/web'
import { FlashbotsRpcProvider } from 'uniswap/src/features/providers/FlashbotsRpcProvider'

jest.mock('@ethersproject/web')
const testAddress = '0xF570F45f598fD48AF83FABD692629a2caFe899ec'

describe('FlashbotsRpcProvider', () => {
  let mockSigner: jest.Mocked<Signer>
  let provider: FlashbotsRpcProvider

  beforeEach(() => {
    jest.mock('@ethersproject/properties', () => ({
      resolveProperties: jest.fn().mockImplementation((input) => Promise.resolve(input)),
    }))
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue(testAddress),
      signMessage: jest.fn().mockResolvedValue('0xsignature'),
    } as unknown as jest.Mocked<Signer>
    provider = new FlashbotsRpcProvider({ signerInfo: { signer: mockSigner, address: testAddress } })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getTransactionCount', () => {
    it('should use super.getTransactionCount for non-pending blocks', async () => {
      const superGetTransactionCount = jest.spyOn(JsonRpcProvider.prototype, 'getTransactionCount')
      superGetTransactionCount.mockResolvedValue(5)

      const result = await provider.getTransactionCount(testAddress, 'latest')

      expect(result).toBe(5)
      expect(superGetTransactionCount).toHaveBeenCalledWith(testAddress, 'latest')
    })

    it('should use super.getTransactionCount for other addresses', async () => {
      const superGetTransactionCount = jest.spyOn(JsonRpcProvider.prototype, 'getTransactionCount')
      superGetTransactionCount.mockResolvedValue(11)

      const result = await provider.getTransactionCount('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 'latest')

      expect(result).toBe(11)
      expect(superGetTransactionCount).toHaveBeenCalledWith('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 'latest')
    })

    it('should use authenticated request for pending blocks', async () => {
      const mockFetchJson = require('@ethersproject/web').fetchJson
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
      const mockFetchJson = require('@ethersproject/web').fetchJson
      mockFetchJson.mockResolvedValue({ error: { message: 'Test error', code: 123 } })

      await expect(provider.getTransactionCount(testAddress, 'pending')).rejects.toThrow('Test error')
    })
  })
})
