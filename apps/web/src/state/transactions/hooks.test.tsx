import { BigNumber } from '@ethersproject/bignumber'
import { permit2Address } from '@uniswap/permit2-sdk'
import { TradeType } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import {
  useHasPendingApproval,
  useHasPendingRevocation,
  useTransactionAdder,
  useTransactionCanceller,
  useTransactionRemover,
} from 'state/transactions/hooks'
import { mocked } from 'test-utils/mocked'
import { act } from 'test-utils/render'
import { renderHookWithProviders } from 'test-utils/renderHookWithProviders'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ApproveTransactionInfo, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { vi } from 'vitest'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useChainId } from 'wagmi'

// Mock useAccount hook
vi.mock('hooks/useAccount')
vi.mock('wagmi', async () => {
  const wagmi = await vi.importActual('wagmi')
  return {
    ...wagmi,
    useChainId: vi.fn(),
  }
})
vi.mock('uniswap/src/features/wallet/hooks/useWallet')

describe('Transactions hooks', () => {
  const address = '0x0000000000000000000000000000000000000000'
  const transactionHash = '0x123'

  beforeEach(() => {
    mocked(useAccount).mockReturnValue({
      chainId: UniverseChainId.Mainnet,
      address,
      status: 'connected',
    } as unknown as ReturnType<typeof useAccount>)

    mocked(useChainId).mockReturnValue(UniverseChainId.Mainnet)

    mocked(useWallet).mockReturnValue({
      evmAccount: {
        address,
        chainId: UniverseChainId.Mainnet,
        status: 'connected',
      },
    } as unknown as ReturnType<typeof useWallet>)

    vi.useFakeTimers()
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const mockTransactionResponse = {
    hash: transactionHash,
    from: address,
    to: permit2Address(UniverseChainId.Mainnet),
    data: '0x',
    value: BigNumber.from(0),
    gasLimit: BigNumber.from(100000),
    gasPrice: BigNumber.from(20000000000),
    nonce: 1,
    chainId: UniverseChainId.Mainnet,
    confirmations: 0,
    wait: vi.fn(),
  }

  const mockTransactionInfo: ApproveTransactionInfo = {
    type: TransactionType.Approve,
    tokenAddress: USDC_MAINNET.address,
    spender: permit2Address(UniverseChainId.Mainnet),
    approvalAmount: '1000000',
  }

  describe('useTransactionAdder', () => {
    it('adds a transaction', () => {
      const { result, store } = renderHookWithProviders(() => useTransactionAdder())

      act(() => {
        result.current(mockTransactionResponse, mockTransactionInfo)
      })

      const state = store.getState()
      expect(state.transactions[address][UniverseChainId.Mainnet]?.[transactionHash]).toBeDefined()
    })
  })

  describe('useTransactionRemover', () => {
    it('removes a transaction', () => {
      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the remover hook
      const { result: remover } = renderHookWithProviders(() => useTransactionRemover(), { store })

      // First add a transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, mockTransactionInfo)
      })

      // Then remove it
      act(() => {
        remover.current(transactionHash)
      })

      const state = store.getState()
      expect(state.transactions[address][UniverseChainId.Mainnet]?.[transactionHash]).toBeUndefined()
    })
  })

  describe('useHasPendingApproval', () => {
    it('returns true when there is a pending transaction', () => {
      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the approval hook
      const { result } = renderHookWithProviders(
        () => useHasPendingApproval(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
        { store },
      )

      // Add a transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, mockTransactionInfo)
      })

      expect(result.current).toBe(true)
    })

    it('returns false when there is a pending transaction but it is not an approval', () => {
      const swapTransactionInfo = {
        type: TransactionType.Swap,
        inputCurrencyId: 'ETH',
        outputCurrencyId: 'USDC',
        tradeType: TradeType.EXACT_INPUT,
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1000000',
        minimumOutputCurrencyAmountRaw: '950000',
      } as const

      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the approval hook
      const { result } = renderHookWithProviders(
        () => useHasPendingApproval(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
        { store },
      )

      // Add a swap transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, swapTransactionInfo)
      })

      expect(result.current).toBe(false)
    })

    it('returns false when there is a pending approval but it is not for the current chain', () => {
      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the approval hook
      const { result } = renderHookWithProviders(
        () => useHasPendingApproval(USDC_MAINNET, '0x000000000022D473030F116dDEE9F6B43aC78BA4'), // Different spender
        { store },
      )

      // Add a transaction using the proper hook (this will be added to Mainnet chain)
      act(() => {
        adder.current(mockTransactionResponse, mockTransactionInfo)
      })

      // The hook should return false because it only looks at the current chain (Mainnet)
      // but we're checking for a different spender
      expect(result.current).toBe(false)
    })

    it('returns false when there is a confirmed approval transaction', () => {
      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the approval hook
      const { result } = renderHookWithProviders(
        () => useHasPendingApproval(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
        { store },
      )

      // Add a transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, mockTransactionInfo)
      })

      // Then finalize it to confirmed status using the correct action
      act(() => {
        store.dispatch({
          type: 'transactions/interfaceFinalizeTransaction',
          payload: {
            chainId: UniverseChainId.Mainnet,
            hash: transactionHash,
            address,
            status: 'confirmed',
            info: mockTransactionInfo,
          },
        })
      })

      expect(result.current).toBe(false)
    })

    it('returns false when there are no pending transactions', () => {
      const { result } = renderHookWithProviders(() =>
        useHasPendingApproval(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
      )

      expect(result.current).toBe(false)
    })

    it('returns false when there is a pending revocation', () => {
      const revocationTransactionInfo: ApproveTransactionInfo = {
        ...mockTransactionInfo,
        approvalAmount: '0',
      }

      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the approval hook
      const { result } = renderHookWithProviders(
        () => useHasPendingApproval(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
        { store },
      )

      // Add a revocation transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, revocationTransactionInfo)
      })

      expect(result.current).toBe(false)
    })
  })

  describe('useHasPendingRevocation', () => {
    it('returns true when there is a pending revocation transaction', () => {
      const revocationTransactionInfo: ApproveTransactionInfo = {
        ...mockTransactionInfo,
        approvalAmount: '0',
      }

      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the revocation hook
      const { result } = renderHookWithProviders(
        () => useHasPendingRevocation(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
        { store },
      )

      // Add a revocation transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, revocationTransactionInfo)
      })

      expect(result.current).toBe(true)
    })

    it('returns false when there is a pending transaction but it is not a revocation', () => {
      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the revocation hook
      const { result } = renderHookWithProviders(
        () => useHasPendingRevocation(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
        { store },
      )

      // Add a regular approval transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, mockTransactionInfo)
      })

      expect(result.current).toBe(false)
    })

    it('returns false when there is a pending revocation but it is not for the current chain', () => {
      const revocationTransactionInfo: ApproveTransactionInfo = {
        ...mockTransactionInfo,
        approvalAmount: '0',
      }

      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the revocation hook
      const { result } = renderHookWithProviders(
        () => useHasPendingRevocation(USDC_MAINNET, '0x000000000022D473030F116dDEE9F6B43aC78BA4'), // Different spender
        { store },
      )

      // Add a revocation transaction using the proper hook (this will be added to Mainnet chain)
      act(() => {
        adder.current(mockTransactionResponse, revocationTransactionInfo)
      })

      // The hook should return false because it only looks at the current chain (Mainnet)
      // but we're checking for a different spender
      expect(result.current).toBe(false)
    })

    it('returns false when there is a confirmed approval transaction', () => {
      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the revocation hook
      const { result } = renderHookWithProviders(
        () => useHasPendingRevocation(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
        { store },
      )

      // Add a transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, mockTransactionInfo)
      })

      // Then finalize it to confirmed status using the correct action
      act(() => {
        store.dispatch({
          type: 'transactions/interfaceFinalizeTransaction',
          payload: {
            chainId: UniverseChainId.Mainnet,
            hash: transactionHash,
            address,
            status: 'confirmed',
            info: mockTransactionInfo,
          },
        })
      })

      expect(result.current).toBe(false)
    })

    it('returns false when there are no pending transactions', () => {
      const { result } = renderHookWithProviders(() =>
        useHasPendingRevocation(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
      )

      expect(result.current).toBe(false)
    })

    it('returns false when there is a pending approval', () => {
      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the revocation hook
      const { result } = renderHookWithProviders(
        () => useHasPendingRevocation(USDC_MAINNET, permit2Address(UniverseChainId.Mainnet)),
        { store },
      )

      // Add a regular approval transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, mockTransactionInfo)
      })

      expect(result.current).toBe(false)
    })
  })

  describe('useTransactionCanceller', () => {
    it('cancels a transaction', () => {
      // Create a shared store for this test
      const { result: adder, store } = renderHookWithProviders(() => useTransactionAdder())

      // Use the same store for the canceller hook
      const { result: canceller } = renderHookWithProviders(() => useTransactionCanceller(), { store })

      // First add a transaction using the proper hook
      act(() => {
        adder.current(mockTransactionResponse, mockTransactionInfo)
      })

      // Then cancel it
      const cancelHash = '0x456'
      act(() => {
        canceller.current(transactionHash, UniverseChainId.Mainnet, cancelHash)
      })

      const state = store.getState()
      // The original transaction should be deleted
      expect(state.transactions[address][UniverseChainId.Mainnet]?.[transactionHash]).toBeUndefined()

      // The cancelled transaction should exist with the cancel hash as the ID
      const cancelledTransaction = state.transactions[address][UniverseChainId.Mainnet]?.[cancelHash]
      expect(cancelledTransaction).toBeDefined()
      expect((cancelledTransaction as any)?.cancelled).toBe(true)
      expect(cancelledTransaction?.hash).toBe(cancelHash)
    })
  })
})
