import { encodeFunctionData } from 'viem'
import { describe, expect, it } from 'vitest'
import {
  backendClaimBatch,
  backendClaimOne,
  backendExitOne,
  backendExitPartial,
  type FixtureCall,
  migrateData,
  multicallData,
} from '../test/backendSettleCalldata'
import { MULTICALL3_ADDRESS, refuseExitAndClaimCalldata, type RequestedExitAndClaim } from './exitAndClaim'

/**
 * The combined settle's whole-batch rules, ported from apps/pools-xyz's repository suite
 * (settleExitAndClaim.test.ts), which reaches the same function through the gateway repository.
 * Here each case calls it directly and pins the reason code.
 */

const AUCTION_CONTRACT = '0xaa00000000000000000000000000000000000001'
const OTHER_CONTRACT = '0xbb00000000000000000000000000000000000002'
/** The backend's LBP strategy — an address the client has no source for, which is the point of the
 * migrate rule. */
const STRATEGY = '0xcc00000000000000000000000000000000000003'
const WALLET = '0xb00aa1c7c6ebe3c40be9dba1e8cbf593b2571e73'
const OTHER_WALLET = '0x1a25d02f5c65a4a1387b48d7005d97e7bd2823fe'

const exitCall = (bidId: bigint, overrides: Partial<FixtureCall> = {}): FixtureCall => ({
  target: AUCTION_CONTRACT,
  allowFailure: false,
  callData: backendExitOne(bidId),
  ...overrides,
})
const claimBatchCall = (owner: string, bidIds: bigint[], overrides: Partial<FixtureCall> = {}): FixtureCall => ({
  target: AUCTION_CONTRACT,
  allowFailure: false,
  callData: backendClaimBatch(owner as `0x${string}`, bidIds),
  ...overrides,
})
const migrateCall = (initializer: string, overrides: Partial<FixtureCall> = {}): FixtureCall => ({
  target: STRATEGY,
  allowFailure: true,
  callData: migrateData(initializer),
  ...overrides,
})

const REFUND: RequestedExitAndClaim = {
  kind: 'refund',
  auctionContractAddress: AUCTION_CONTRACT,
  owner: WALLET,
  bids: [
    { bidId: '41', isExited: false },
    { bidId: '42', isExited: false },
  ],
}
const CLAIM: RequestedExitAndClaim = {
  ...REFUND,
  kind: 'claim',
  bids: [
    { bidId: '41', isExited: false },
    // The partially-filled shape: already exited, still claimable.
    { bidId: '42', isExited: true },
  ],
}

/** The claim answer the backend constructs for CLAIM: exit the non-exited bid, claim ALL bids,
 * opportunistically bundle migrate. */
const HONEST_CLAIM_BATCH = multicallData([
  exitCall(41n),
  claimBatchCall(WALLET, [41n, 42n]),
  migrateCall(AUCTION_CONTRACT),
])
const HONEST_REFUND_BATCH = multicallData([exitCall(41n), exitCall(42n)])

function refusal(requested: RequestedExitAndClaim, data: string, to: string = MULTICALL3_ADDRESS): string | undefined {
  return refuseExitAndClaimCalldata({ to, data }, requested)
}

describe('malformed calldata', () => {
  it('refuses an odd trailing hex digit or a non-hex character, on either target', () => {
    expect(refusal(CLAIM, `${HONEST_CLAIM_BATCH}0`)).toBe('selector')
    expect(refusal(CLAIM, `${HONEST_CLAIM_BATCH.slice(0, -1)}g`)).toBe('selector')
    const oneBidRefund: RequestedExitAndClaim = { ...REFUND, bids: [{ bidId: '41', isExited: false }] }
    const directExit = exitCall(41n).callData
    expect(refusal(oneBidRefund, directExit, AUCTION_CONTRACT)).toBeUndefined()
    expect(refusal(oneBidRefund, `${directExit}0`, AUCTION_CONTRACT)).toBe('selector')
  })
})

describe('accepted responses', () => {
  it('accepts the direct single-exit answer', () => {
    expect(
      refusal({ ...REFUND, bids: [{ bidId: '41', isExited: false }] }, backendExitOne(41n), AUCTION_CONTRACT),
    ).toBeUndefined()
  })

  it('accepts a multi-exit refund batch addressed to Multicall3', () => {
    expect(refusal(REFUND, HONEST_REFUND_BATCH)).toBeUndefined()
  })

  it('accepts the graduated claim shape: exits for non-exited bids, a claim of all, and the migrate bundle', () => {
    expect(refusal(CLAIM, HONEST_CLAIM_BATCH)).toBeUndefined()
  })

  it('accepts a direct claimTokensBatch when every bid already exited', () => {
    const allExited: RequestedExitAndClaim = {
      ...CLAIM,
      bids: [
        { bidId: '41', isExited: true },
        { bidId: '42', isExited: true },
      ],
    }
    expect(refusal(allExited, backendClaimBatch(WALLET, [41n, 42n]), AUCTION_CONTRACT)).toBeUndefined()
  })

  it('accepts the partially-filled exit encoding', () => {
    const data = multicallData([
      exitCall(41n, { callData: backendExitPartial(41n, { lastFullyFilledCheckpointBlock: 1n, outbidBlock: 2n }) }),
      exitCall(42n),
    ])
    expect(refusal(REFUND, data)).toBeUndefined()
  })

  it('accepts addresses in any casing', () => {
    expect(refusal({ ...CLAIM, owner: WALLET.toUpperCase().replace('0X', '0x') }, HONEST_CLAIM_BATCH)).toBeUndefined()
    expect(refusal(REFUND, HONEST_REFUND_BATCH, MULTICALL3_ADDRESS.toLowerCase())).toBeUndefined()
  })
})

describe('refused responses', () => {
  it('refuses an outer `to` that is neither the auction contract nor Multicall3', () => {
    expect(refusal(REFUND, HONEST_REFUND_BATCH, OTHER_CONTRACT)).toBe('target')
  })

  it('refuses a malformed outer `to` as a target mismatch, not a throw', () => {
    expect(refusal(REFUND, HONEST_REFUND_BATCH, 'not-an-address')).toBe('target')
  })

  it('refuses a Multicall3 call that is not aggregate3', () => {
    expect(refusal(REFUND, backendExitOne(41n))).toBe('selector')
  })

  it('refuses an inner call targeting a contract the request never named', () => {
    expect(refusal(REFUND, multicallData([exitCall(41n), exitCall(42n, { target: OTHER_CONTRACT })]))).toBe('target')
  })

  it('refuses a foreign selector inside the batch', () => {
    const transfer = encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'transfer',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ type: 'bool' }],
        },
      ] as const,
      functionName: 'transfer',
      args: [OTHER_WALLET as `0x${string}`, 1n],
    })
    expect(
      refusal(
        REFUND,
        multicallData([
          exitCall(41n),
          exitCall(42n),
          { target: AUCTION_CONTRACT, allowFailure: false, callData: transfer },
        ]),
      ),
    ).toBe('selector')
  })

  it('refuses a NESTED multicall', () => {
    const nested = multicallData([exitCall(41n)])
    expect(
      refusal(
        REFUND,
        multicallData([exitCall(42n), { target: AUCTION_CONTRACT, allowFailure: false, callData: nested }]),
      ),
    ).toBe('selector')
  })

  it('refuses an EXTRA exit the request never asked for', () => {
    expect(refusal(REFUND, multicallData([exitCall(41n), exitCall(42n), exitCall(99n)]))).toBe('arguments')
  })

  it('refuses a batch that DROPS a requested bid', () => {
    expect(refusal(REFUND, multicallData([exitCall(41n)]))).toBe('arguments')
  })

  it('compares exits as a MULTISET, so a duplicate cannot absorb an unrequested bid', () => {
    const duplicated: RequestedExitAndClaim = {
      ...REFUND,
      bids: [
        { bidId: '41', isExited: false },
        { bidId: '41', isExited: false },
      ],
    }
    expect(refusal(duplicated, multicallData([exitCall(41n), exitCall(99n)]))).toBe('arguments')
  })

  it('refuses a non-decimal requested bid id — hex is not folded onto its decimal twin', () => {
    const hex: RequestedExitAndClaim = { ...REFUND, bids: [{ bidId: '0x29', isExited: false }] }
    expect(refusal(hex, backendExitOne(41n), AUCTION_CONTRACT)).toBe('arguments')
  })

  it('refuses a claim leg paying out to another owner', () => {
    expect(refusal(CLAIM, multicallData([exitCall(41n), claimBatchCall(OTHER_WALLET, [41n, 42n])]))).toBe('owner')
  })

  it('refuses a claim leg naming a different bid set than the whole request', () => {
    expect(refusal(CLAIM, multicallData([exitCall(41n), claimBatchCall(WALLET, [41n])]))).toBe('arguments')
  })

  it('refuses allowFailure on a settle call — atomicity is the accounting model', () => {
    expect(refusal(REFUND, multicallData([exitCall(41n), exitCall(42n, { allowFailure: true })]))).toBe('allowFailure')
  })

  it('refuses a fallible call that is not the migrate bundle', () => {
    expect(
      refusal(
        REFUND,
        multicallData([
          exitCall(41n),
          exitCall(42n),
          { target: STRATEGY, allowFailure: true, callData: backendExitOne(7n) },
        ]),
      ),
    ).toBe('allowFailure')
  })

  it('refuses a migrate bundle naming another auction as initializer', () => {
    expect(refusal(REFUND, multicallData([exitCall(41n), exitCall(42n), migrateCall(OTHER_CONTRACT)]))).toBe(
      'allowFailure',
    )
  })

  it('refuses a claim leg answering a REFUND — a transfer the user never reviewed', () => {
    expect(refusal(REFUND, multicallData([exitCall(41n), exitCall(42n), claimBatchCall(WALLET, [41n, 42n])]))).toBe(
      'arguments',
    )
  })

  it('refuses exits-only calldata answering a CLAIM — a refund behind a dialog saying Claim', () => {
    expect(refusal(CLAIM, multicallData([exitCall(41n)]))).toBe('arguments')
  })

  it('refuses a batch of only migrates — it settles nothing', () => {
    expect(refusal(REFUND, multicallData([migrateCall(AUCTION_CONTRACT)]))).toBe('arguments')
  })

  // `claimTokens(uint256)` carries no owner to check (the contract pays the bid's stored owner), and
  // the combined path never wraps it, so a wrapped one is refused even when the multisets match.
  it('refuses the ownerless claimTokens encoding inside a wrapped batch', () => {
    const oneBid: RequestedExitAndClaim = { ...CLAIM, bids: [{ bidId: '41', isExited: false }] }
    expect(
      refusal(
        oneBid,
        multicallData([
          exitCall(41n),
          { target: AUCTION_CONTRACT, allowFailure: false, callData: backendClaimOne(41n) },
        ]),
      ),
    ).toBe('owner')
  })

  // A DIRECT auction-contract call is how a one-bid claim is encoded, so it stays admitted there.
  it('still accepts a direct-to-auction claimTokens answer', () => {
    expect(
      refusal({ ...CLAIM, bids: [{ bidId: '41', isExited: true }] }, backendClaimOne(41n), AUCTION_CONTRACT),
    ).toBeUndefined()
  })
})

/**
 * A caller that leaves the claim decision to the service: the leg may be present or absent, and
 * every other rule still holds — so a present leg must pay the owner for exactly the requested bids.
 */
describe('an `either` request', () => {
  const EITHER: RequestedExitAndClaim = { ...CLAIM, kind: 'either' }

  it('accepts the graduated claim shape and the exits-only shape', () => {
    expect(refusal(EITHER, HONEST_CLAIM_BATCH)).toBeUndefined()
    expect(refusal({ ...REFUND, kind: 'either' }, HONEST_REFUND_BATCH)).toBeUndefined()
  })

  it('still refuses a claim leg paying out to another owner', () => {
    expect(refusal(EITHER, multicallData([exitCall(41n), claimBatchCall(OTHER_WALLET, [41n, 42n])]))).toBe('owner')
  })

  it('still refuses a claim leg naming a different bid set than the whole request', () => {
    expect(refusal(EITHER, multicallData([exitCall(41n), claimBatchCall(WALLET, [41n])]))).toBe('arguments')
  })

  it('refuses a second claim leg', () => {
    expect(
      refusal(
        EITHER,
        multicallData([exitCall(41n), claimBatchCall(WALLET, [41n, 42n]), claimBatchCall(WALLET, [41n, 42n])]),
      ),
    ).toBe('arguments')
  })

  it('still refuses exits that disagree with the request, and a batch that settles nothing', () => {
    expect(refusal(EITHER, multicallData([exitCall(99n), claimBatchCall(WALLET, [41n, 42n])]))).toBe('arguments')
    expect(refusal(EITHER, multicallData([migrateCall(AUCTION_CONTRACT)]))).toBe('arguments')
  })
})
