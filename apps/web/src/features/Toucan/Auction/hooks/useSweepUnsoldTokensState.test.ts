import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSweepUnsoldTokensState } from '~/features/Toucan/Auction/hooks/useSweepUnsoldTokensState'
import { AuctionOutcome } from '~/features/Toucan/Auction/store/types'

const AUCTION = '0x00004c4ccc709Ef590F7C81102C0689F0263D4e9'
const CHAIN_ID = 130

const mockStoreState = {
  auctionDetails: null as { address?: string; chainId?: number } | null,
}
let mockOutcome: AuctionOutcome = AuctionOutcome.UNKNOWN
const mockSetSweepUnsoldTokensBlock = vi.fn()

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
  useAuctionOutcome: () => mockOutcome,
  useAuctionStoreActions: () => ({ setSweepUnsoldTokensBlock: mockSetSweepUnsoldTokensBlock }),
}))

vi.mock('@uniswap/liquidity-launcher-sdk', () => ({
  sweepUnsoldTokensBlockCall: (address: string) => ({
    address,
    abi: [],
    functionName: 'sweepUnsoldTokensBlock',
    args: [],
  }),
  remainingSupplyCall: (address: string) => ({ address, abi: [], functionName: 'remainingSupply', args: [] }),
}))

// Mutable per-read responses, keyed by the descriptor's functionName.
const mockReadData: { sweepUnsoldTokensBlock: bigint | undefined; remainingSupply: bigint | undefined } = {
  sweepUnsoldTokensBlock: undefined,
  remainingSupply: undefined,
}
const mockRefetchSweepBlock = vi.fn()
const mockUseReadContract = vi.fn(
  (params: { functionName: 'sweepUnsoldTokensBlock' | 'remainingSupply'; query: { enabled: boolean } }) => ({
    data: params.query.enabled ? mockReadData[params.functionName] : undefined,
    refetch: params.functionName === 'sweepUnsoldTokensBlock' ? mockRefetchSweepBlock : vi.fn(),
  }),
)
vi.mock('wagmi', () => ({
  useReadContract: (params: unknown) => mockUseReadContract(params as never),
}))

function readCallParams(functionName: string): { query: { enabled: boolean } } | undefined {
  return mockUseReadContract.mock.calls.map(([params]) => params).find((params) => params.functionName === functionName)
}

describe('useSweepUnsoldTokensState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.auctionDetails = { address: AUCTION, chainId: CHAIN_ID }
    mockOutcome = AuctionOutcome.GRADUATED
    mockReadData.sweepUnsoldTokensBlock = undefined
    mockReadData.remainingSupply = undefined
  })

  it('returns undefined and syncs undefined into the store while the sweep block read is loading', () => {
    const { result } = renderHook(() => useSweepUnsoldTokensState())

    expect(result.current.hasSwept).toBeUndefined()
    expect(result.current.remainingSupplyRaw).toBeUndefined()
    expect(mockSetSweepUnsoldTokensBlock).toHaveBeenCalledWith(undefined)
  })

  it('derives not-swept from a zero sweep block latch and exposes the remaining supply', () => {
    mockReadData.sweepUnsoldTokensBlock = 0n
    mockReadData.remainingSupply = 500n

    const { result } = renderHook(() => useSweepUnsoldTokensState())

    expect(result.current.hasSwept).toBe(false)
    expect(result.current.remainingSupplyRaw).toBe(500n)
    expect(mockSetSweepUnsoldTokensBlock).toHaveBeenCalledWith('0')
  })

  it('derives swept once the one-shot latch is set and syncs the block into the store', () => {
    mockReadData.sweepUnsoldTokensBlock = 12345n

    const { result } = renderHook(() => useSweepUnsoldTokensState())

    expect(result.current.hasSwept).toBe(true)
    expect(mockSetSweepUnsoldTokensBlock).toHaveBeenCalledWith('12345')
    expect(result.current.refetchSweepBlock).toBe(mockRefetchSweepBlock)
  })

  it('disables both reads while the auction has not ended', () => {
    mockOutcome = AuctionOutcome.ACTIVE
    mockReadData.sweepUnsoldTokensBlock = 12345n

    const { result } = renderHook(() => useSweepUnsoldTokensState())

    expect(readCallParams('sweepUnsoldTokensBlock')?.query.enabled).toBe(false)
    expect(readCallParams('remainingSupply')?.query.enabled).toBe(false)
    expect(result.current.hasSwept).toBeUndefined()
  })

  it('disables both reads when the enabled flag is off', () => {
    renderHook(() => useSweepUnsoldTokensState({ enabled: false }))

    expect(readCallParams('sweepUnsoldTokensBlock')?.query.enabled).toBe(false)
    expect(readCallParams('remainingSupply')?.query.enabled).toBe(false)
  })

  it('only reads remainingSupply on the graduated path, not for a failed launch', () => {
    mockOutcome = AuctionOutcome.FAILED
    mockReadData.sweepUnsoldTokensBlock = 0n
    mockReadData.remainingSupply = 500n

    const { result } = renderHook(() => useSweepUnsoldTokensState())

    expect(readCallParams('sweepUnsoldTokensBlock')?.query.enabled).toBe(true)
    expect(readCallParams('remainingSupply')?.query.enabled).toBe(false)
    expect(result.current.hasSwept).toBe(false)
    expect(result.current.remainingSupplyRaw).toBeUndefined()
  })
})
