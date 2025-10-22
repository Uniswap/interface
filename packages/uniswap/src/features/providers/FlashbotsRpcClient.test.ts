/* eslint-disable no-extra-semi */
import { Signer } from '@ethersproject/abstract-signer'
import { SignerInfo, waitForFlashbotsProtectReceipt } from 'uniswap/src/features/providers/FlashbotsCommon'
import { createFlashbotsRpcClient } from 'uniswap/src/features/providers/FlashbotsRpcClient'
import { HexString } from 'utilities/src/addresses/hex'
import { Chain, PublicClient } from 'viem'
import { mainnet } from 'viem/chains'

// Mock fetch
global.fetch = jest.fn() as jest.Mock

const testAddress = '0xF570F45f598fD48AF83FABD692629a2caFe899ec' as HexString

// Define a mock chain for testing
const mockChain: Chain = {
  ...mainnet,
  id: 1,
  name: 'Mock Chain',
}

// Mock the sleep function to avoid waiting in tests
jest.mock('utilities/src/time/timing', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
}))

describe('FlashbotsRpcClient', () => {
  let mockSigner: jest.Mocked<Signer>
  let signerInfo: SignerInfo
  let client: PublicClient

  beforeEach(() => {
    // Reset mocks
    ;(global.fetch as jest.Mock).mockReset()
    // Create mock signer
    mockSigner = {
      signMessage: jest.fn().mockResolvedValue(`0xsignature` as HexString),
      getAddress: jest.fn().mockResolvedValue(testAddress),
      signTransaction: jest.fn(),
      connect: jest.fn(),
      _isSigner: true,
      provider: undefined,
      _checkProvider: jest.fn(),
      estimateGas: jest.fn(),
      call: jest.fn(),
      resolveProperties: jest.fn(),
      populateTransaction: jest.fn(),
      checkTransaction: jest.fn(),
      sendTransaction: jest.fn(),
      getBalance: jest.fn(),
      getTransactionCount: jest.fn(),
      getChainId: jest.fn(),
      getGasPrice: jest.fn(),
      getFeeData: jest.fn(),
      resolveName: jest.fn(),
    } as jest.Mocked<Signer>

    // Create signer info
    signerInfo = {
      address: testAddress,
      signer: mockSigner,
    }

    // Create Flashbots client
    client = createFlashbotsRpcClient({
      chain: mockChain,
      signerInfo,
    })
  })

  describe('createFlashbotsRpcClient', () => {
    it('should create a client with the correct URL and parameters', async () => {
      // Mock successful response for eth_blockNumber
      mockFetchResponse({ result: '0x2328' })

      // Create client with default parameters
      const flashbotsClient = createFlashbotsRpcClient({
        chain: mockChain,
        signerInfo,
      })

      // Make a test request to trigger URL construction
      await flashbotsClient.request({
        method: 'eth_blockNumber',
        params: undefined,
      })

      // Verify the request was made with the correct URL
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestUrl = fetchCall[0]

      // Check base URL
      expect(requestUrl).toContain('rpc.flashbots.net/fast')
      // Check refund parameter (default 50%)
      expect(requestUrl).toContain(`refund=${testAddress}:50`)
      // Check origin ID
      expect(requestUrl).toContain('originId=uniswapwallet')

      // Verify client properties
      expect(client).toBeDefined()
      expect(client.chain).toEqual(mockChain)
      expect(client.transport.type).toBe('flashbots')
    })

    it('should add refund parameter when provided', async () => {
      const refundPercent = 75

      // Mock successful response for eth_blockNumber
      mockFetchResponse({ result: '0x2328' })

      // Create a client with custom refund
      const clientWithRefund = createFlashbotsRpcClient({
        chain: mockChain,
        signerInfo,
        refundPercent,
      })

      // Make a test request to trigger URL construction
      await clientWithRefund.request({
        method: 'eth_blockNumber',
        params: undefined,
      })

      // Verify the request was made with the correct URL including custom refund
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestUrl = fetchCall[0]
      expect(requestUrl).toContain(`refund=${testAddress}:${refundPercent}`)
    })
  })

  describe('eth_getTransactionCount', () => {
    it('should use standard transport for non-pending blocks', async () => {
      // Mock the response for a non-pending transaction count
      mockFetchResponse({ result: '0x5' })

      const result = await client.request({
        method: 'eth_getTransactionCount',
        params: [testAddress, 'latest'],
      })

      expect(result).toBe('0x5')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Check that the Flashbots signature header was NOT added (standard request)
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1]?.headers
      expect(headers?.['X-Flashbots-Signature']).toBeUndefined()
    })

    it('should add authentication for pending blocks with matching address', async () => {
      // Mock the response for a pending transaction count
      mockFetchResponse({ result: '0x3' })

      const result = await client.request({
        method: 'eth_getTransactionCount',
        params: [testAddress, 'pending'],
      })

      expect(result).toBe('0x3')
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(mockSigner.signMessage).toHaveBeenCalled()

      // Check that the Flashbots signature header was added
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1]?.headers
      expect(headers?.['X-Flashbots-Signature']).toBe(`${testAddress}:0xsignature`)
    })

    it('should use standard transport for addresses that do not match the signer', async () => {
      const differentAddress = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' as HexString

      // Mock the response
      mockFetchResponse({ result: '0x7' })

      const result = await client.request({
        method: 'eth_getTransactionCount',
        params: [differentAddress, 'pending'],
      })

      expect(result).toBe('0x7')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Check that the Flashbots signature header was NOT added
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1]?.headers
      expect(headers?.['X-Flashbots-Signature']).toBeUndefined()
    })

    it('should throw an error if the response contains an error', async () => {
      // Mock an error response
      mockFetchResponse({ error: { message: 'Test error', code: 123 } })

      await expect(
        client.request({
          method: 'eth_getTransactionCount',
          params: [testAddress, 'pending'],
        }),
      ).rejects.toThrow('Test error')

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(mockSigner.signMessage).toHaveBeenCalled()
    })

    it('should throw an error if the fetch request fails', async () => {
      // Mock a failed fetch
      mockFetchResponse(null, false)

      await expect(
        client.request({
          method: 'eth_getTransactionCount',
          params: [testAddress, 'pending'],
        }),
      ).rejects.toThrow('HTTP request failed.')
      expect(global.fetch).toHaveBeenCalledTimes(4) // 1 for the initial request, 3 for the retries
    })
  })

  describe('other methods', () => {
    it('should use standard transport for other methods', async () => {
      // Mock the response for another method
      mockFetchResponse({ result: '0x2328' })

      const result = await client.request({
        method: 'eth_blockNumber',
        params: undefined, // eth_blockNumber takes no parameters
      })

      expect(result).toBe('0x2328')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Verify the request was made with the correct URL and standard transport which has no headers
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]

      const headers = fetchCall[1]?.headers
      expect(headers?.['Content-Type']).toBe('application/json')
      expect(headers?.['X-Flashbots-Signature']).toBeUndefined()
      const requestUrl = fetchCall[0]
      expect(requestUrl).toContain('rpc.flashbots.net/fast')

      // Verify transport configuration
      expect(client.transport.type).toBe('flashbots')
    })
  })
})

describe('waitForFlashbotsProtectReceipt', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockReset()
  })

  it('should poll until a final status is received', async () => {
    const transactionHash = '0x123456789abcdef'

    // Mock responses - first PENDING, then INCLUDED
    mockFetchResponse({
      status: 'PENDING',
      hash: transactionHash,
      maxBlockNumber: 100,
      transaction: {
        from: testAddress,
        to: '0x1111111111111111111111111111111111111111',
        gasLimit: '0x5208',
        maxFeePerGas: '0x2540be400',
        maxPriorityFeePerGas: '0x3b9aca00',
        nonce: '0x1',
        value: '0x0',
      },
      fastMode: true,
      seenInMempool: false,
    })

    mockFetchResponse({
      status: 'INCLUDED',
      hash: transactionHash,
      maxBlockNumber: 100,
      transaction: {
        from: testAddress,
        to: '0x1111111111111111111111111111111111111111',
        gasLimit: '0x5208',
        maxFeePerGas: '0x2540be400',
        maxPriorityFeePerGas: '0x3b9aca00',
        nonce: '0x1',
        value: '0x0',
      },
      fastMode: true,
      seenInMempool: true,
    })

    const receipt = await waitForFlashbotsProtectReceipt(transactionHash)

    expect(receipt.status).toBe('INCLUDED')
    expect(receipt.hash).toBe(transactionHash)
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Verify the URL is correctly formed
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
    expect(fetchCall[0]).toBe(`https://protect.flashbots.net/tx/${transactionHash}`)
  })

  it('should throw an error if the response is not valid', async () => {
    const transactionHash = '0x123456789abcdef'

    // Mock an invalid response
    mockFetchResponse({ invalid: 'response' })

    await expect(waitForFlashbotsProtectReceipt(transactionHash)).rejects.toThrow(
      'Invalid response structure from Flashbots API',
    )

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should throw an error if the HTTP request fails', async () => {
    const transactionHash = '0x123456789abcdef'

    // Mock a failed fetch
    mockFetchResponse(null, false)

    await expect(waitForFlashbotsProtectReceipt(transactionHash)).rejects.toThrow('HTTP error: 400 Bad Request')

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})

// Helper function to mock fetch responses
function mockFetchResponse(responseData: unknown, ok = true): void {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: jest.fn().mockResolvedValueOnce(responseData),
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    headers: new Headers({
      'content-type': 'application/json',
    }),
  })
}
