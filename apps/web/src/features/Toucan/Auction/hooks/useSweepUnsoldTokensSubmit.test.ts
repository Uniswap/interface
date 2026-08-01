import { act, renderHook } from '@testing-library/react'
import { logger } from 'utilities/src/logger/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSweepUnsoldTokensSubmit } from '~/features/Toucan/Auction/hooks/useSweepUnsoldTokensSubmit'
import { mocked } from '~/test-utils/mocked'

const AUCTION = '0x00004c4ccc709Ef590F7C81102C0689F0263D4e9'
const CHAIN_ID = 130
const TX = { to: AUCTION as `0x${string}`, data: '0xdeadbeef' as `0x${string}`, value: 0n }
const TX_HASH = '0x1111111111111111111111111111111111111111111111111111111111111111'

const mockStoreState = {
  auctionDetails: null as { address?: string; chainId?: number } | null,
}

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

const mockSelectChain = vi.fn()
vi.mock('~/hooks/useSelectChain', () => ({
  useSelectChain: () => mockSelectChain,
}))

const mockBuildSweepUnsoldTokensTx = vi.fn()
vi.mock('@uniswap/liquidity-launcher-sdk', () => ({
  buildSweepUnsoldTokensTx: (...args: unknown[]) => mockBuildSweepUnsoldTokensTx(...args),
}))

const mockSendTransactionAsync = vi.fn()
// Mutable so the confirmation test can flip the receipt to success and rerender.
const mockReceiptState = { isLoading: false, isSuccess: false }
const mockSendTransactionState = { isPending: false }
vi.mock('wagmi', () => ({
  useSendTransaction: () => ({
    sendTransactionAsync: mockSendTransactionAsync,
    isPending: mockSendTransactionState.isPending,
  }),
  useWaitForTransactionReceipt: () => mockReceiptState,
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

describe('useSweepUnsoldTokensSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.auctionDetails = { address: AUCTION, chainId: CHAIN_ID }
    mockReceiptState.isLoading = false
    mockReceiptState.isSuccess = false
    mockSendTransactionState.isPending = false
    mockSelectChain.mockResolvedValue(true)
    mockBuildSweepUnsoldTokensTx.mockReturnValue(TX)
    mockSendTransactionAsync.mockResolvedValue(TX_HASH)
  })

  it('is a no-op without auction details', async () => {
    mockStoreState.auctionDetails = null

    const { result } = renderHook(() => useSweepUnsoldTokensSubmit({}))
    await act(() => result.current.onSubmit())

    expect(mockSelectChain).not.toHaveBeenCalled()
    expect(mockSendTransactionAsync).not.toHaveBeenCalled()
    expect(result.current.error).toBeUndefined()
  })

  it('is a no-op when the auction has no chainId', async () => {
    mockStoreState.auctionDetails = { address: AUCTION }

    const { result } = renderHook(() => useSweepUnsoldTokensSubmit({}))
    await act(() => result.current.onSubmit())

    expect(mockSelectChain).not.toHaveBeenCalled()
    expect(mockSendTransactionAsync).not.toHaveBeenCalled()
  })

  it('sets an error and sends nothing when the chain switch fails', async () => {
    mockSelectChain.mockResolvedValue(false)

    const { result } = renderHook(() => useSweepUnsoldTokensSubmit({}))
    await act(() => result.current.onSubmit())

    expect(mockSelectChain).toHaveBeenCalledWith(CHAIN_ID)
    expect(mockSendTransactionAsync).not.toHaveBeenCalled()
    expect(result.current.error?.message).toBe('Failed to switch networks for the creator sweep')
  })

  it('builds the sweep tx for the auction address and sends it on the auction chain', async () => {
    const onTransactionSubmitted = vi.fn()
    const { result } = renderHook(() => useSweepUnsoldTokensSubmit({ onTransactionSubmitted }))
    await act(() => result.current.onSubmit())

    expect(mockBuildSweepUnsoldTokensTx).toHaveBeenCalledWith({ auctionAddress: AUCTION })
    expect(mockSendTransactionAsync).toHaveBeenCalledWith({
      to: TX.to,
      data: TX.data,
      value: TX.value,
      chainId: CHAIN_ID,
    })
    expect(onTransactionSubmitted).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeUndefined()
  })

  it('fires onTransactionConfirmed once the receipt succeeds', async () => {
    const onTransactionConfirmed = vi.fn()
    const { result, rerender } = renderHook(() => useSweepUnsoldTokensSubmit({ onTransactionConfirmed }))
    await act(() => result.current.onSubmit())

    mockReceiptState.isSuccess = true
    await act(async () => rerender())

    expect(onTransactionConfirmed).toHaveBeenCalledTimes(1)
  })

  it('reports isPending while the receipt is confirming', async () => {
    mockReceiptState.isLoading = true

    const { result } = renderHook(() => useSweepUnsoldTokensSubmit({}))

    expect(result.current.isPending).toBe(true)
    expect(result.current.isWaitingForWallet).toBe(false)
  })

  it('surfaces a wallet rejection as error and logs it', async () => {
    const rejection = new Error('User rejected the request')
    mockSendTransactionAsync.mockRejectedValue(rejection)

    const { result } = renderHook(() => useSweepUnsoldTokensSubmit({}))
    await act(() => result.current.onSubmit())

    expect(result.current.error).toBe(rejection)
    expect(mocked(logger.error)).toHaveBeenCalledWith(rejection, {
      tags: { file: 'useSweepUnsoldTokensSubmit', function: 'onSubmit' },
      extra: { auctionAddress: AUCTION, chainId: CHAIN_ID },
    })
  })
})
