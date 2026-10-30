import { act, renderHook } from '@testing-library/react'
import { UnsignableSettleError } from '@universe/cca'
import { Platform } from '@universe/chains'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { encodeFunctionData } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWithdrawBidAndClaimTokensFormSubmit } from '~/features/Toucan/Auction/hooks/useWithdrawBidAndClaimTokensFormSubmit'
import { AuctionBidStatus } from '~/features/Toucan/Auction/store/types'
import { WithdrawSenderMismatchError } from '~/features/Toucan/Auction/utils/withdrawSettleGuard'

const WALLET = '0x96Bb3Da8C202Cd35eB280Ca191A9dCF1d316C27f' as const
const OTHER = '0x1A25D02F5C65a4A1387b48d7005D97E7Bd2823fE' as const
const AUCTION = '0xcb7B92AeF642eE1d4c9b4c8D08cfb738a7Af1493' as const
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11' as const
const CHAIN_ID = 130

// Settle calldata as the backend liquidity service encodes it (lib/contracts/auction.ts).
const SETTLE_ABI = [
  {
    type: 'function',
    name: 'exitBid',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_bidId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimTokensBatch',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_bidIds', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'aggregate3',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'calls',
        type: 'tuple[]',
        components: [
          { name: 'target', type: 'address' },
          { name: 'allowFailure', type: 'bool' },
          { name: 'callData', type: 'bytes' },
        ],
      },
    ],
    outputs: [],
  },
] as const

const exitBid = (bidId: bigint): `0x${string}` =>
  encodeFunctionData({ abi: SETTLE_ABI, functionName: 'exitBid', args: [bidId] })
const claimBatch = (owner: `0x${string}`, bidIds: bigint[]): `0x${string}` =>
  encodeFunctionData({ abi: SETTLE_ABI, functionName: 'claimTokensBatch', args: [owner, bidIds] })
const aggregate3 = (calls: `0x${string}`[]): string =>
  encodeFunctionData({
    abi: SETTLE_ABI,
    functionName: 'aggregate3',
    args: [calls.map((callData) => ({ target: AUCTION, allowFailure: false, callData }))],
  })

/** The honest answer for the stored bids: exit the submitted bid 41, claim both. */
const HONEST_BATCH = aggregate3([exitBid(41n), claimBatch(WALLET, [41n, 42n])])

function served(overrides: Partial<Record<'to' | 'from' | 'data' | 'value', string> & { chainId: number }> = {}): {
  to: string
  from: string
  data: string
  value: string
  chainId: number
} {
  return { to: MULTICALL3, from: WALLET, data: HONEST_BATCH, value: '0x00', chainId: CHAIN_ID, ...overrides }
}

const mockExitAndClaim = vi.fn()
vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/useExitBidAndClaimTokensMutation', () => ({
  useExitBidAndClaimTokensMutation: () => ({ mutateAsync: mockExitAndClaim, reset: vi.fn(), isPending: false }),
}))

const mockExitBidPosition = vi.fn()
vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/useExitBidPositionMutation', () => ({
  useExitBidPositionMutation: () => ({ mutateAsync: mockExitBidPosition, reset: vi.fn(), isPending: false }),
}))

const mockWallet = {
  evmAccount: { platform: Platform.EVM, accountType: AccountType.SignerMnemonic, address: WALLET as string },
}
vi.mock('uniswap/src/features/wallet/hooks/useWallet', () => ({
  useWallet: () => mockWallet,
}))

vi.mock('utilities/src/telemetry/trace/TraceContext', () => ({
  useTrace: () => ({}),
}))

vi.mock('~/features/Toucan/Auction/analytics', () => ({
  getAuctionWithdrawBaseAnalyticsProperties: () => ({}),
}))

const STORED_BIDS = [
  { bidId: '41', status: AuctionBidStatus.Submitted },
  { bidId: '42', status: AuctionBidStatus.Exited },
]
const mockStoreState = { userBids: STORED_BIDS, refetchUserBids: vi.fn() }
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
  useAuctionStoreActions: () => ({ addPendingWithdrawalBid: vi.fn(), addAwaitingConfirmationBid: vi.fn() }),
}))

// Lets a test make request-building rewrite `to`, to prove the guard reads the request that is signed.
const mockBuiltTo = vi.hoisted(() => ({ value: undefined as string | undefined }))
vi.mock('uniswap/src/features/transactions/swap/utils/trade', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/transactions/swap/utils/trade')>()
  return {
    ...actual,
    validateTransactionRequest: (...args: Parameters<typeof actual.validateTransactionRequest>) => {
      const built = actual.validateTransactionRequest(...args)
      return built && mockBuiltTo.value ? { ...built, to: mockBuiltTo.value } : built
    },
  }
})

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

// The saga settles the submit promise through these callbacks; a wallet that signed reports success.
const mockTrigger = vi.fn((params: { onSuccess: (hash: string) => void }) => params.onSuccess('0xhash'))

type SubmitParams = { bidId?: string; mode?: 'exit' | 'claim'; isPreClaimWindow?: boolean }

function renderSubmit(params: SubmitParams = {}) {
  return renderHook(() =>
    useWithdrawBidAndClaimTokensFormSubmit({
      accountAddress: WALLET,
      auctionContractAddress: AUCTION,
      chainId: CHAIN_ID,
      triggerWithdrawBidAndClaimTokens: mockTrigger,
      ...params,
    }),
  )
}

async function submit(params: SubmitParams = {}): Promise<Error | undefined> {
  const { result } = renderSubmit(params)
  await act(async () => {
    await result.current.submitState.onSubmit().catch(() => undefined)
  })
  return result.current.submitState.error
}

function refusalReason(error: Error | undefined): string | undefined {
  return error instanceof UnsignableSettleError ? error.reason : error?.name
}

describe('useWithdrawBidAndClaimTokensFormSubmit pre-signing checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWallet.evmAccount.address = WALLET
    mockBuiltTo.value = undefined
    mockStoreState.userBids = STORED_BIDS
    mockExitAndClaim.mockResolvedValue({ requestId: 'req-1', exitBidAndClaimTokens: served() })
  })

  it('signs the honest batch for the requested bids', async () => {
    const error = await submit()

    expect(error).toBeUndefined()
    expect(mockExitAndClaim).toHaveBeenCalledWith(
      expect.objectContaining({
        bids: [
          expect.objectContaining({ bidId: '41', isExited: false }),
          expect.objectContaining({ bidId: '42', isExited: true }),
        ],
      }),
    )
    expect(mockTrigger).toHaveBeenCalledTimes(1)
    expect(mockTrigger.mock.calls[0]?.[0]).toMatchObject({ chainId: CHAIN_ID, txRequest: { to: MULTICALL3 } })
  })

  // The service adds the claim leg only once the auction is over and graduated, so an exits-only
  // answer is legitimate whatever the page believes about graduation.
  it('signs an exits-only answer', async () => {
    mockStoreState.userBids = [{ bidId: '41', status: AuctionBidStatus.Submitted }]
    mockExitAndClaim.mockResolvedValue({
      requestId: 'req-1',
      exitBidAndClaimTokens: served({ to: AUCTION, data: exitBid(41n) }),
    })

    expect(await submit()).toBeUndefined()
    expect(mockTrigger).toHaveBeenCalledTimes(1)
  })

  it.each([
    [
      'a claim leg paying out to another owner',
      served({ data: aggregate3([exitBid(41n), claimBatch(OTHER, [41n, 42n])]) }),
      'owner',
    ],
    [
      'a batch that exits a bid the request never named',
      served({ data: aggregate3([exitBid(99n), claimBatch(WALLET, [41n, 42n])]) }),
      'bids',
    ],
    [
      'a claim leg that drops a requested bid',
      served({ data: aggregate3([exitBid(41n), claimBatch(WALLET, [41n])]) }),
      'bids',
    ],
    ['a transaction addressed to another contract', served({ to: OTHER }), 'target'],
    ['a transaction prepared for another chain', served({ chainId: 8453 }), 'chain'],
    ['a transaction carrying native value', served({ value: '0x1' }), 'value'],
    ['a zero value in a spelling the server-side check refuses', served({ value: '-0' }), 'value'],
    ['calldata that is not whole-byte hex', served({ data: `${HONEST_BATCH}0` }), 'data'],
    ['a transaction from another sender', served({ from: OTHER }), 'WithdrawSenderMismatchError'],
  ])('refuses %s before the wallet', async (_name, answer, reason) => {
    mockExitAndClaim.mockResolvedValue({ requestId: 'req-1', exitBidAndClaimTokens: answer })

    const error = await submit()

    expect(refusalReason(error)).toBe(reason)
    expect(mockTrigger).not.toHaveBeenCalled()
  })

  it('checks the request it signs, not the response it was built from', async () => {
    mockBuiltTo.value = OTHER

    const error = await submit()

    expect(refusalReason(error)).toBe('target')
    expect(mockTrigger).not.toHaveBeenCalled()
  })

  // `exitBid(<another of the signer's own open bids>)` does not revert: money out of the wrong
  // position, and the dialog reports the requested bid as withdrawn.
  it('refuses a pre-claim exit answered with a different bid id', async () => {
    mockExitBidPosition.mockResolvedValue({
      requestId: 'req-2',
      exitBid: { to: AUCTION, from: WALLET, data: exitBid(99n), value: '0x00', chainId: CHAIN_ID },
    })

    const error = await submit({ bidId: '41', isPreClaimWindow: true })

    expect(refusalReason(error)).toBe('bids')
    expect(mockTrigger).not.toHaveBeenCalled()
  })

  it('signs a pre-claim exit of the requested bid', async () => {
    mockExitBidPosition.mockResolvedValue({
      requestId: 'req-2',
      exitBid: { to: AUCTION, from: WALLET, data: exitBid(41n), value: '0x00', chainId: CHAIN_ID },
    })

    expect(await submit({ bidId: '41', isPreClaimWindow: true })).toBeUndefined()
    expect(mockTrigger).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['addressed to another contract', { to: OTHER }, 'target'],
    ['prepared for another chain', { chainId: 8453 }, 'chain'],
    ['carrying native value', { value: '0x1' }, 'value'],
    ['calling an unknown selector', { data: `0xdeadbeef${exitBid(41n).slice(10)}` }, 'data'],
  ])('refuses a pre-claim exit %s', async (_name, override, reason) => {
    mockExitBidPosition.mockResolvedValue({
      requestId: 'req-2',
      exitBid: { to: AUCTION, from: WALLET, data: exitBid(41n), value: '0x00', chainId: CHAIN_ID, ...override },
    })

    const error = await submit({ bidId: '41', isPreClaimWindow: true })

    expect(refusalReason(error)).toBe(reason)
    expect(mockTrigger).not.toHaveBeenCalled()
  })

  // A single already-exited bid: the request marks it `isExited`, so only the claim leg may come back.
  it('signs a claim-only answer for a single exited bid', async () => {
    mockExitAndClaim.mockResolvedValue({
      requestId: 'req-1',
      exitBidAndClaimTokens: served({ to: AUCTION, data: claimBatch(WALLET, [41n]) }),
    })

    expect(await submit({ bidId: '41', mode: 'claim' })).toBeUndefined()
    expect(mockExitAndClaim).toHaveBeenCalledWith(
      expect.objectContaining({ bids: [expect.objectContaining({ bidId: '41', isExited: true })] }),
    )
    expect(mockTrigger).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['an exit leg alongside the claim', served({ data: aggregate3([exitBid(41n), claimBatch(WALLET, [41n])]) })],
    ['an exits-only answer', served({ to: AUCTION, data: exitBid(41n) })],
  ])('refuses a single exited bid answered with %s', async (_name, answer) => {
    mockExitAndClaim.mockResolvedValue({ requestId: 'req-1', exitBidAndClaimTokens: answer })

    const error = await submit({ bidId: '41', mode: 'claim' })

    expect(refusalReason(error)).toBe('bids')
    expect(mockTrigger).not.toHaveBeenCalled()
  })

  // The review modal prepares on open and submits later; the wallet can switch accounts in between.
  it('refuses at submit when the connected account changed after preparing', async () => {
    const { result } = renderSubmit()
    let prepared: Awaited<ReturnType<typeof result.current.submitState.prepareTransaction>>
    await act(async () => {
      prepared = await result.current.submitState.prepareTransaction()
    })
    mockWallet.evmAccount.address = OTHER

    await act(async () => {
      await result.current.submitState.onSubmit(prepared).catch(() => undefined)
    })

    expect(result.current.submitState.error).toBeInstanceOf(WithdrawSenderMismatchError)
    expect(mockTrigger).not.toHaveBeenCalled()
  })
})
