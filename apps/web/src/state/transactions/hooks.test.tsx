import { BigNumber } from '@ethersproject/bignumber'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { USDC_MAINNET } from 'constants/tokens'
import store from 'state'
import { mocked } from 'test-utils/mocked'
import { act, renderHook } from 'test-utils/render'

import {
  useHasPendingApproval,
  useHasPendingRevocation,
  useTransactionAdder,
  useTransactionCanceller,
  useTransactionRemover,
} from './hooks'
import { clearAllTransactions, finalizeTransaction } from './reducer'
import { ApproveTransactionInfo, TransactionInfo, TransactionType } from './types'

const pendingTransactionResponse = {
  hash: '0x123',
  timestamp: 1000,
  from: '0x123',
  wait: jest.fn(),
  nonce: 1,
  gasLimit: BigNumber.from(1000),
  data: '0x',
  value: BigNumber.from(0),
  chainId: ChainId.MAINNET,
  confirmations: 0,
  blockNumber: undefined,
  blockHash: undefined,
}

const mockApprovalTransactionInfo: ApproveTransactionInfo = {
  type: TransactionType.APPROVAL,
  tokenAddress: USDC_MAINNET.address,
  spender: PERMIT2_ADDRESS,
  amount: '10000',
}

const mockRevocationTransactionInfo: TransactionInfo = {
  ...mockApprovalTransactionInfo,
  amount: '0',
}

describe('Transactions hooks', () => {
  beforeEach(() => {
    mocked(useWeb3React).mockReturnValue({ chainId: 1, account: '0x123' } as ReturnType<typeof useWeb3React>)

    jest.useFakeTimers()
    store.dispatch(clearAllTransactions({ chainId: ChainId.MAINNET }))
  })

  function addPendingTransaction(txInfo: TransactionInfo) {
    const { result } = renderHook(() => useTransactionAdder())
    act(() => {
      result.current(pendingTransactionResponse, txInfo)
    })
  }

  function addConfirmedTransaction(txInfo: TransactionInfo) {
    addPendingTransaction(txInfo)

    act(() => {
      store.dispatch(
        finalizeTransaction({
          chainId: ChainId.MAINNET,
          hash: pendingTransactionResponse.hash,
          receipt: {
            status: 1,
            transactionIndex: 1,
            transactionHash: pendingTransactionResponse.hash,
            to: '0x0',
            from: '0x0',
            contractAddress: '0x0',
            blockHash: '0x0',
            blockNumber: 1,
          },
        })
      )
    })
  }

  it('useTransactionAdder adds a transaction', () => {
    addPendingTransaction(mockApprovalTransactionInfo)
    expect(store.getState().transactions[ChainId.MAINNET][pendingTransactionResponse.hash]).toEqual({
      hash: pendingTransactionResponse.hash,
      info: mockApprovalTransactionInfo,
      from: pendingTransactionResponse.from,
      addedTime: Date.now(),
      nonce: pendingTransactionResponse.nonce,
      deadline: undefined,
    })
  })

  it('useTransactionRemover removes a transaction', () => {
    addPendingTransaction(mockApprovalTransactionInfo)

    const { result: remover } = renderHook(() => useTransactionRemover())
    act(() => {
      remover.current(pendingTransactionResponse.hash)
    })
    expect(store.getState().transactions[ChainId.MAINNET][pendingTransactionResponse.hash]).toBeUndefined()
  })

  describe('useHasPendingApproval', () => {
    it('returns true when there is a pending transaction', () => {
      addPendingTransaction(mockApprovalTransactionInfo)
      const { result } = renderHook(() => useHasPendingApproval(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(true)
    })

    it('returns false when there is a pending transaction but it is not an approval', () => {
      addPendingTransaction({
        type: TransactionType.SUBMIT_PROPOSAL,
      })
      const { result } = renderHook(() => useHasPendingApproval(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })

    it('returns false when there is a pending approval but it is not for the current chain', () => {
      mocked(useWeb3React).mockReturnValue({ chainId: 2 } as ReturnType<typeof useWeb3React>)
      addPendingTransaction(mockApprovalTransactionInfo)
      const { result } = renderHook(() => useHasPendingApproval(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })

    it('returns false when there is a confirmed approval transaction', () => {
      addConfirmedTransaction(mockApprovalTransactionInfo)
      const { result } = renderHook(() => useHasPendingApproval(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })

    it('returns false when there are no pending transactions', () => {
      const { result } = renderHook(() => useHasPendingApproval(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })

    it('returns false when there is a pending revocation', () => {
      addPendingTransaction(mockRevocationTransactionInfo)
      const { result } = renderHook(() => useHasPendingApproval(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })
  })

  describe('useHasPendingRevocation', () => {
    it('returns true when there is a pending revocation', () => {
      addPendingTransaction(mockRevocationTransactionInfo)
      const { result } = renderHook(() => useHasPendingRevocation(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(true)
    })

    it('returns false when there is a pending transaction but it is not a revocation', () => {
      addPendingTransaction({
        type: TransactionType.SUBMIT_PROPOSAL,
      })
      const { result } = renderHook(() => useHasPendingRevocation(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })

    it('returns false when there is a pending revocation but it is not for the current chain', () => {
      mocked(useWeb3React).mockReturnValue({ chainId: 2 } as ReturnType<typeof useWeb3React>)
      addPendingTransaction(mockRevocationTransactionInfo)
      const { result } = renderHook(() => useHasPendingRevocation(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })

    it('returns false when there is a confirmed approval transaction', () => {
      addConfirmedTransaction(mockRevocationTransactionInfo)
      const { result } = renderHook(() => useHasPendingRevocation(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })

    it('returns false when there are no pending transactions', () => {
      const { result } = renderHook(() => useHasPendingRevocation(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })

    it('returns false when there is a pending approval', () => {
      addPendingTransaction(mockApprovalTransactionInfo)
      const { result } = renderHook(() => useHasPendingRevocation(USDC_MAINNET, PERMIT2_ADDRESS))
      expect(result.current).toBe(false)
    })
  })

  describe('useTransactionCanceller', () => {
    it('Replaces the original tx with a cancel tx with a different hash', () => {
      addPendingTransaction(mockApprovalTransactionInfo)
      const { result: canceller } = renderHook(() => useTransactionCanceller())

      const originalTransactionDetails = store.getState().transactions[ChainId.MAINNET][pendingTransactionResponse.hash]

      act(() => canceller.current(pendingTransactionResponse.hash, ChainId.MAINNET, '0x456'))

      expect(store.getState().transactions[ChainId.MAINNET][pendingTransactionResponse.hash]).toBeUndefined()

      expect(store.getState().transactions[ChainId.MAINNET]['0x456']).toEqual({
        ...originalTransactionDetails,
        hash: '0x456',
        cancelled: true,
      })
    })
  })
})
