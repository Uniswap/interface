import { act, renderHook } from '@testing-library/react'
import { logger } from 'utilities/src/logger/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMigrateSubmit } from '~/features/Toucan/Auction/hooks/useMigrateSubmit'
import { mocked } from '~/test-utils/mocked'

const AUCTION = '0x00004c4ccc709Ef590F7C81102C0689F0263D4e9'
const STRATEGY = '0x298eA05D0356B2Ae5cCAa3169E471783ee9EA000'
const CHAIN_ID = 130
const TX = { to: STRATEGY as `0x${string}`, data: '0xdeadbeef' as `0x${string}`, value: 0n }
const TX_HASH = '0x1111111111111111111111111111111111111111111111111111111111111111'

const mockStoreState = {
  auctionDetails: null as { address?: string; chainId?: number; lbpStrategyAddress?: string } | null,
}

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
  useAuctionStoreActions: () => ({ setAuctionDetails: vi.fn() }),
}))

const mockSelectChain = vi.fn()
vi.mock('~/hooks/useSelectChain', () => ({
  useSelectChain: () => mockSelectChain,
}))

const mockBuildMigrateTx = vi.fn()
vi.mock('@uniswap/liquidity-launcher-sdk', () => ({
  buildMigrateTx: (...args: unknown[]) => mockBuildMigrateTx(...args),
}))

const mockSendTransactionAsync = vi.fn()
// Mutable so the confirmation test can flip the receipt to success and rerender.
const mockReceiptState = { isLoading: false, isSuccess: false }
vi.mock('wagmi', () => ({
  useSendTransaction: () => ({ sendTransactionAsync: mockSendTransactionAsync, isPending: false }),
  useWaitForTransactionReceipt: () => mockReceiptState,
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

describe('useMigrateSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.auctionDetails = { address: AUCTION, chainId: CHAIN_ID, lbpStrategyAddress: STRATEGY }
    mockReceiptState.isLoading = false
    mockReceiptState.isSuccess = false
    mockSelectChain.mockResolvedValue(true)
    mockBuildMigrateTx.mockReturnValue(TX)
    mockSendTransactionAsync.mockResolvedValue(TX_HASH)
  })

  it('is a no-op without auction details', async () => {
    mockStoreState.auctionDetails = null

    const { result } = renderHook(() => useMigrateSubmit({}))
    await act(() => result.current.onSubmit())

    expect(mockSelectChain).not.toHaveBeenCalled()
    expect(mockSendTransactionAsync).not.toHaveBeenCalled()
    expect(result.current.error).toBeUndefined()
  })

  it('is a no-op when the auction has no lbpStrategyAddress', async () => {
    mockStoreState.auctionDetails = { address: AUCTION, chainId: CHAIN_ID }

    const { result } = renderHook(() => useMigrateSubmit({}))
    await act(() => result.current.onSubmit())

    expect(mockSelectChain).not.toHaveBeenCalled()
    expect(mockSendTransactionAsync).not.toHaveBeenCalled()
  })

  it('sets an error and sends nothing when the chain switch fails', async () => {
    mockSelectChain.mockResolvedValue(false)

    const { result } = renderHook(() => useMigrateSubmit({}))
    await act(() => result.current.onSubmit())

    expect(mockSelectChain).toHaveBeenCalledWith(CHAIN_ID)
    expect(mockSendTransactionAsync).not.toHaveBeenCalled()
    expect(result.current.error?.message).toBe('Failed to switch networks for the LBP migration')
  })

  it('builds the migrate tx for the strategy/auction pair and sends it on the auction chain', async () => {
    const { result } = renderHook(() => useMigrateSubmit({}))
    await act(() => result.current.onSubmit())

    expect(mockBuildMigrateTx).toHaveBeenCalledWith({ lbpStrategyAddress: STRATEGY, auctionAddress: AUCTION })
    expect(mockSendTransactionAsync).toHaveBeenCalledWith({
      to: TX.to,
      data: TX.data,
      value: TX.value,
      chainId: CHAIN_ID,
    })
    expect(result.current.error).toBeUndefined()
    expect(result.current.isConfirmed).toBe(false)
  })

  it('flags isConfirmed and fires onTransactionConfirmed once the receipt succeeds', async () => {
    const onTransactionConfirmed = vi.fn()
    const { result, rerender } = renderHook(() => useMigrateSubmit({ onTransactionConfirmed }))
    await act(() => result.current.onSubmit())

    mockReceiptState.isSuccess = true
    await act(async () => rerender())

    expect(onTransactionConfirmed).toHaveBeenCalledTimes(1)
    expect(result.current.isConfirmed).toBe(true)
  })

  it('surfaces a wallet rejection as error and logs it', async () => {
    const rejection = new Error('User rejected the request')
    mockSendTransactionAsync.mockRejectedValue(rejection)

    const { result } = renderHook(() => useMigrateSubmit({}))
    await act(() => result.current.onSubmit())

    expect(result.current.error).toBe(rejection)
    expect(mocked(logger.error)).toHaveBeenCalledWith(rejection, {
      tags: { file: 'useMigrateSubmit', function: 'onSubmit' },
      extra: { auctionAddress: AUCTION, lbpStrategyAddress: STRATEGY, chainId: CHAIN_ID },
    })
  })
})
