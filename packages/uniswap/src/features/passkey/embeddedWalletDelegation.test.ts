import { checkWalletDelegation, TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { fetchGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import {
  checkEmbeddedWalletDelegation,
  type DelegationResult,
  sendDelegatedTransaction,
} from 'uniswap/src/features/passkey/embeddedWalletDelegation'
import { sign7702AuthorizationWithPasskey, sign7702TransactionWithPasskey } from 'uniswap/src/features/passkey/signing'
import { getAddress } from 'viem'
import { type MockedFunction, vi } from 'vitest'

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  checkWalletDelegation: vi.fn(),
  TradingApiClient: {
    fetchWalletEncoding7702: vi.fn(),
  },
}))

vi.mock('uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery', () => ({
  fetchGasFeeQuery: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/signing', () => ({
  sign7702AuthorizationWithPasskey: vi.fn(),
  sign7702TransactionWithPasskey: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/chainInfo', () => ({
  getChainInfo: vi.fn().mockReturnValue({ id: 130 }),
}))

const mockCheckWalletDelegation = checkWalletDelegation as MockedFunction<typeof checkWalletDelegation>
const mockFetchWalletEncoding7702 = TradingApiClient.fetchWalletEncoding7702 as MockedFunction<
  typeof TradingApiClient.fetchWalletEncoding7702
>
const mockFetchGasFeeQuery = fetchGasFeeQuery as MockedFunction<typeof fetchGasFeeQuery>
const mockSign7702Auth = sign7702AuthorizationWithPasskey as MockedFunction<typeof sign7702AuthorizationWithPasskey>
const mockSign7702Tx = sign7702TransactionWithPasskey as MockedFunction<typeof sign7702TransactionWithPasskey>

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`
const MOCK_CHAIN_ID = 130
const MOCK_DELEGATION_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

describe('embeddedWalletDelegation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkEmbeddedWalletDelegation', () => {
    it('returns needsDelegation: true for fresh delegation (no current, has latest)', async () => {
      mockCheckWalletDelegation.mockResolvedValue({
        delegationDetails: {
          [MOCK_ADDRESS]: {
            [MOCK_CHAIN_ID]: {
              currentDelegationAddress: undefined,
              latestDelegationAddress: MOCK_DELEGATION_ADDRESS,
              isWalletDelegatedToUniswap: false,
            },
          },
        },
      } as any)

      const result = await checkEmbeddedWalletDelegation(MOCK_ADDRESS, MOCK_CHAIN_ID)

      expect(result).toEqual({
        needsDelegation: true,
        contractAddress: MOCK_DELEGATION_ADDRESS,
        currentDelegationAddress: undefined,
        isWalletDelegatedToUniswap: false,
      })
    })

    it('returns needsDelegation: true for upgrade (current != latest, isWalletDelegatedToUniswap)', async () => {
      mockCheckWalletDelegation.mockResolvedValue({
        delegationDetails: {
          [MOCK_ADDRESS]: {
            [MOCK_CHAIN_ID]: {
              currentDelegationAddress: '0xoldaddress',
              latestDelegationAddress: MOCK_DELEGATION_ADDRESS,
              isWalletDelegatedToUniswap: true,
            },
          },
        },
      } as any)

      const result = await checkEmbeddedWalletDelegation(MOCK_ADDRESS, MOCK_CHAIN_ID)

      expect(result).toEqual({
        needsDelegation: true,
        contractAddress: MOCK_DELEGATION_ADDRESS,
        currentDelegationAddress: '0xoldaddress',
        isWalletDelegatedToUniswap: true,
      })
    })

    it('returns needsDelegation: false when already delegated (current == latest)', async () => {
      mockCheckWalletDelegation.mockResolvedValue({
        delegationDetails: {
          [MOCK_ADDRESS]: {
            [MOCK_CHAIN_ID]: {
              currentDelegationAddress: MOCK_DELEGATION_ADDRESS,
              latestDelegationAddress: MOCK_DELEGATION_ADDRESS,
              isWalletDelegatedToUniswap: true,
            },
          },
        },
      } as any)

      const result = await checkEmbeddedWalletDelegation(MOCK_ADDRESS, MOCK_CHAIN_ID)

      expect(result).toEqual({
        needsDelegation: false,
        contractAddress: MOCK_DELEGATION_ADDRESS,
        currentDelegationAddress: MOCK_DELEGATION_ADDRESS,
        isWalletDelegatedToUniswap: true,
      })
    })

    it('returns needsDelegation: true for fresh delegation with null currentDelegationAddress', async () => {
      mockCheckWalletDelegation.mockResolvedValue({
        delegationDetails: {
          [MOCK_ADDRESS]: {
            [MOCK_CHAIN_ID]: {
              currentDelegationAddress: null,
              latestDelegationAddress: MOCK_DELEGATION_ADDRESS,
              isWalletDelegatedToUniswap: false,
            },
          },
        },
      } as any)

      const result = await checkEmbeddedWalletDelegation(MOCK_ADDRESS, MOCK_CHAIN_ID)

      expect(result).toEqual({
        needsDelegation: true,
        contractAddress: MOCK_DELEGATION_ADDRESS,
        currentDelegationAddress: undefined,
        isWalletDelegatedToUniswap: false,
      })
    })

    it('returns null for non-Uniswap delegation', async () => {
      mockCheckWalletDelegation.mockResolvedValue({
        delegationDetails: {
          [MOCK_ADDRESS]: {
            [MOCK_CHAIN_ID]: {
              currentDelegationAddress: '0xother',
              latestDelegationAddress: MOCK_DELEGATION_ADDRESS,
              isWalletDelegatedToUniswap: false,
            },
          },
        },
      } as any)

      const result = await checkEmbeddedWalletDelegation(MOCK_ADDRESS, MOCK_CHAIN_ID)
      expect(result).toBeNull()
    })

    it('returns null when no delegation details', async () => {
      mockCheckWalletDelegation.mockResolvedValue({ delegationDetails: {} } as any)
      const result = await checkEmbeddedWalletDelegation(MOCK_ADDRESS, MOCK_CHAIN_ID)
      expect(result).toBeNull()
    })

    it('returns null on API error (does not throw)', async () => {
      mockCheckWalletDelegation.mockRejectedValue(new Error('API error'))
      const result = await checkEmbeddedWalletDelegation(MOCK_ADDRESS, MOCK_CHAIN_ID)
      expect(result).toBeNull()
    })
  })

  describe('sendDelegatedTransaction', () => {
    const mockPublicClient = {
      estimateFeesPerGas: vi.fn().mockResolvedValue({ maxFeePerGas: BigInt(1000), maxPriorityFeePerGas: BigInt(100) }),
      getTransactionCount: vi.fn().mockResolvedValue(5),
      estimateGas: vi.fn().mockResolvedValue(BigInt(50000)),
      sendRawTransaction: vi.fn().mockResolvedValue('0xtxhash'),
    }
    const mockSignTransaction = vi.fn().mockResolvedValue('0xsignedtx')
    const mockAccount = {
      address: MOCK_ADDRESS,
      signMessage: vi.fn(),
      signTransaction: mockSignTransaction,
      signTypedData: vi.fn(),
      publicKey: MOCK_ADDRESS,
      source: 'custom' as const,
      type: 'local' as const,
    }
    const baseCtx = {
      transactions: [{ to: '0xrecipient', data: '0xcalldata', value: '0', gas: '100000' }],
      account: mockAccount,
      chainId: MOCK_CHAIN_ID,
      publicClient: mockPublicClient as any,
      signTransaction: mockSignTransaction,
      walletId: 'wallet-1',
    }

    beforeEach(() => {
      mockFetchWalletEncoding7702.mockResolvedValue({
        encoded: {
          data: '0xabcdef1234',
          value: '0',
          gasLimit: undefined,
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
        },
      } as any)
      mockFetchGasFeeQuery.mockResolvedValue({
        value: '12345',
        params: { gasLimit: '250000', maxFeePerGas: '3000', maxPriorityFeePerGas: '300' },
      } as any)
    })

    it('uses 7702 signing flow when needsDelegation is true', async () => {
      mockSign7702Auth.mockResolvedValue({
        contractAddress: MOCK_DELEGATION_ADDRESS,
        chainId: MOCK_CHAIN_ID,
        nonce: 6,
        r: '0xr',
        s: '0xs',
        yParity: 0,
      })
      mockSign7702Tx.mockResolvedValue('0xabcdef1234567890')

      await sendDelegatedTransaction({
        ...baseCtx,
        delegationResult: {
          needsDelegation: true,
          contractAddress: MOCK_DELEGATION_ADDRESS,
          isWalletDelegatedToUniswap: false,
        },
      })

      expect(mockSign7702Auth).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: MOCK_DELEGATION_ADDRESS,
          chainId: MOCK_CHAIN_ID,
          nonce: 6,
        }),
      )
      expect(mockSign7702Tx).toHaveBeenCalledWith(
        expect.objectContaining({ to: MOCK_ADDRESS, data: '0xabcdef1234', nonce: 5 }),
      )
      expect(mockPublicClient.sendRawTransaction).toHaveBeenCalledWith({ serializedTransaction: '0xabcdef1234567890' })
    })

    it('encodes a missing call value as hex, not decimal, for the wallet encoding request', async () => {
      mockSign7702Auth.mockResolvedValue({
        contractAddress: MOCK_DELEGATION_ADDRESS,
        chainId: MOCK_CHAIN_ID,
        nonce: 6,
        r: '0xr',
        s: '0xs',
        yParity: 0,
      })
      mockSign7702Tx.mockResolvedValue('0xabcdef1234567890')

      // ERC-20 transfer calldata carries no native value — matches the shape of a real token send.
      await sendDelegatedTransaction({
        ...baseCtx,
        transactions: [{ to: '0xrecipient', data: '0xcalldata' }],
        delegationResult: {
          needsDelegation: true,
          contractAddress: MOCK_DELEGATION_ADDRESS,
          isWalletDelegatedToUniswap: false,
        },
      })

      // The Trading API rejects `calls[].value` unless it matches /^0x[a-fA-F0-9]+$/ — a plain
      // decimal "0" 400s with RequestValidationError.
      expect(mockFetchWalletEncoding7702).toHaveBeenCalledWith(
        expect.objectContaining({
          calls: [expect.objectContaining({ value: '0x0' })],
        }),
      )
    })

    it('uses standard self-call when already delegated', async () => {
      await sendDelegatedTransaction({
        ...baseCtx,
        delegationResult: {
          needsDelegation: false,
          contractAddress: MOCK_DELEGATION_ADDRESS,
          isWalletDelegatedToUniswap: true,
        },
      })

      expect(mockSign7702Auth).not.toHaveBeenCalled()
      expect(mockSignTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ to: MOCK_ADDRESS, data: '0xabcdef1234' }),
      )
      expect(mockPublicClient.sendRawTransaction).toHaveBeenCalledWith({ serializedTransaction: '0xsignedtx' })
    })

    it('uses encoded gasLimit when available', async () => {
      mockFetchWalletEncoding7702.mockResolvedValue({
        encoded: {
          data: '0xabcdef1234',
          value: '0',
          gasLimit: '200000',
          maxFeePerGas: '2000',
          maxPriorityFeePerGas: '200',
        },
      } as any)
      mockSign7702Auth.mockResolvedValue({
        contractAddress: MOCK_DELEGATION_ADDRESS,
        chainId: MOCK_CHAIN_ID,
        nonce: 6,
        r: '0xr',
        s: '0xs',
        yParity: 0,
      })
      mockSign7702Tx.mockResolvedValue('0xabcdef1234567890')

      await sendDelegatedTransaction({
        ...baseCtx,
        delegationResult: { needsDelegation: true, contractAddress: MOCK_DELEGATION_ADDRESS },
      })

      // Trading API gasLimit is used directly without buffer (already padded server-side)
      expect(mockSign7702Tx).toHaveBeenCalledWith(expect.objectContaining({ gas: '200000' }))
      // Fast path: the gas service is not consulted when encode_7702 already returns gas.
      expect(mockFetchGasFeeQuery).not.toHaveBeenCalled()
    })

    it('uses the gas service with the delegation address when no encoded gasLimit', async () => {
      mockSign7702Auth.mockResolvedValue({
        contractAddress: MOCK_DELEGATION_ADDRESS,
        chainId: MOCK_CHAIN_ID,
        nonce: 6,
        r: '0xr',
        s: '0xs',
        yParity: 0,
      })
      mockSign7702Tx.mockResolvedValue('0xabcdef1234567890')

      await sendDelegatedTransaction({
        ...baseCtx,
        delegationResult: { needsDelegation: true, contractAddress: MOCK_DELEGATION_ADDRESS },
      })

      // Gas is estimated through the gas service with the delegation contract as a state override.
      expect(mockFetchGasFeeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          smartContractDelegationAddress: getAddress(MOCK_DELEGATION_ADDRESS),
          tx: expect.objectContaining({ from: MOCK_ADDRESS, to: MOCK_ADDRESS, data: '0xabcdef1234' }),
        }),
      )
      // Gas service gasLimit + fees are used directly — no client buffer or delegation surcharge.
      expect(mockSign7702Tx).toHaveBeenCalledWith(
        expect.objectContaining({ gas: '250000', maxFeePerGas: '3000', maxPriorityFeePerGas: '300' }),
      )
    })

    it('falls back to a buffered client estimate when the gas service returns no params', async () => {
      mockFetchGasFeeQuery.mockResolvedValue({ value: '12345' } as any)
      mockSign7702Auth.mockResolvedValue({
        contractAddress: MOCK_DELEGATION_ADDRESS,
        chainId: MOCK_CHAIN_ID,
        nonce: 6,
        r: '0xr',
        s: '0xs',
        yParity: 0,
      })
      mockSign7702Tx.mockResolvedValue('0xabcdef1234567890')

      await sendDelegatedTransaction({
        ...baseCtx,
        delegationResult: { needsDelegation: true, contractAddress: MOCK_DELEGATION_ADDRESS },
      })

      // originalTx.gas (100000) buffered by 20% — no delegation surcharge added.
      const expectedGas = (BigInt(100000) * BigInt(12)) / BigInt(10)
      expect(mockSign7702Tx).toHaveBeenCalledWith(expect.objectContaining({ gas: expectedGas.toString() }))
    })

    it('throws when contractAddress is missing', async () => {
      await expect(
        sendDelegatedTransaction({
          ...baseCtx,
          delegationResult: { needsDelegation: true, contractAddress: undefined } as unknown as DelegationResult,
        }),
      ).rejects.toThrow('Delegation contract address is required')
    })
  })
})
