import { describe, expect, it } from 'vitest'
import {
  BACKEND_SETTLE_SELECTORS,
  backendClaimBatch,
  backendClaimOne,
  backendExitOne,
  backendExitPartial,
  migrateData,
  multicallData,
} from '../test/backendSettleCalldata'
import {
  assertExitAndClaimCalldata,
  assertSettleCalldata,
  assertSomethingToSettle,
  BATCH_CLAIM_SELECTOR,
  NothingToSettleError,
  type PreparedSettleTransaction,
  SETTLE_SELECTORS,
  type SettleRequest,
  UnsignableSettleError,
} from './settleCalldata'

/**
 * The signing-boundary checks, ported from apps/pools-xyz's claimExecutor.test.ts ("prepared-
 * transaction guards", "empty batch", "combined-method guards"), which reach the same checks through
 * the executor. Here each case calls the check directly and pins the reason code.
 */

const WALLET = '0x96Bb3Da8C202Cd35eB280Ca191A9dCF1d316C27f'
/** The same address the gateway would echo un-checksummed. */
const WALLET_LOWER = '0x96bb3da8c202cd35eb280ca191a9dcf1d316c27f'
const OTHER = '0x1A25D02F5C65a4A1387b48d7005D97E7Bd2823fE'
const AUCTION = '0xcb7B92AeF642eE1d4c9b4c8D08cfb738a7Af1493'
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11'
const CHAIN_ID = 4663

const CLAIM_DATA = backendClaimOne(41n)
const CLAIM_BATCH_DATA = backendClaimBatch(WALLET, [41n, 42n])
/** The batched answer to a ONE-bid claim, which is legitimate: shouldClaimAll flips the encoder for
 * a single bid too. */
const CLAIM_BATCH_ONE_DATA = backendClaimBatch(WALLET, [41n])
const EXIT_DATA = backendExitOne(41n)
const EXIT_PARTIAL_DATA = backendExitPartial(41n, {
  lastFullyFilledCheckpointBlock: 19_000_000n,
  outbidBlock: 19_000_400n,
})

const PREPARED: PreparedSettleTransaction = {
  chainId: CHAIN_ID,
  transaction: { to: AUCTION, data: CLAIM_DATA, value: '0x0', chainId: CHAIN_ID },
}

/** The honest combined answer to COMBINED_CLAIM: exit 41, claim [41, 42]. */
const COMBINED_DATA = multicallData([
  { target: AUCTION, allowFailure: false, callData: backendExitOne(41n) },
  { target: AUCTION, allowFailure: false, callData: backendClaimBatch(WALLET, [41n, 42n]) },
])
const PREPARED_COMBINED: PreparedSettleTransaction = {
  ...PREPARED,
  transaction: { ...PREPARED.transaction, to: MULTICALL3, data: COMBINED_DATA },
}

const CLAIM: SettleRequest = { kind: 'claim', auctionContractAddress: AUCTION, chainId: CHAIN_ID, bidIds: ['41'] }
const CLAIM_MULTI: SettleRequest = { ...CLAIM, bidIds: ['41', '42'] }
const COMBINED_CLAIM: SettleRequest = {
  kind: 'claim',
  auctionContractAddress: AUCTION,
  chainId: CHAIN_ID,
  bids: [
    { bidId: '41', isExited: false },
    { bidId: '42', isExited: true },
  ],
}
const REFUND: SettleRequest = { kind: 'refund', auctionContractAddress: AUCTION, chainId: CHAIN_ID, bidId: '41' }

function served(
  transaction: Partial<PreparedSettleTransaction['transaction']>,
  base: PreparedSettleTransaction = PREPARED,
): PreparedSettleTransaction {
  return { ...base, transaction: { ...base.transaction, ...transaction } }
}

/** The refusal reason, or `undefined` when the prepared settle is signable. */
function refusal(
  prepared: PreparedSettleTransaction,
  request: SettleRequest,
  owner: string = WALLET,
): string | undefined {
  try {
    assertSettleCalldata({ prepared, request, owner })
    return undefined
  } catch (error) {
    if (error instanceof UnsignableSettleError) {
      return error.reason
    }
    throw error
  }
}

describe('assertSettleCalldata: single-purpose settles', () => {
  it('refuses a transaction addressed to a contract the row did not name', () => {
    expect(refusal(served({ to: OTHER }), CLAIM)).toBe('target')
  })

  // Both settle RPCs are pull-only calls on the auction contract; nothing is ever sent with them.
  it('refuses a transaction carrying native value', () => {
    expect(refusal(served({ value: '0x2386f26fc10000' }), CLAIM)).toBe('value')
  })

  it('accepts a zero value in every served spelling', () => {
    for (const value of ['0x0', '0x00', '0x', '0', '']) {
      expect(refusal(served({ value }), CLAIM)).toBeUndefined()
    }
  })

  // BigInt reads each of these as zero; the server-side check refuses them, so the signing boundary does too.
  it.each(['-0', ' 0', '0 ', '0b0', '0o0', '0X0'])('refuses a zero value in a non-canonical spelling (%j)', (value) => {
    expect(refusal(served({ value }), CLAIM)).toBe('value')
    expect(refusal(served({ value }, PREPARED_COMBINED), COMBINED_CLAIM)).toBe('value')
  })

  it('refuses calldata that is not whole-byte hex', () => {
    expect(refusal(served({ data: `${CLAIM_DATA}0` }), CLAIM)).toBe('data')
    expect(refusal(served({ data: `${CLAIM_DATA.slice(0, -1)}g` }), CLAIM)).toBe('data')
    expect(refusal(served({ data: `${COMBINED_DATA}0` }, PREPARED_COMBINED), COMBINED_CLAIM)).toBe('data')
  })

  // Auction contract addresses are deterministic across chains, so an unguarded served chain signs
  // a well-formed call to the same-address deployment on another network.
  it('refuses a settle prepared for another chain', () => {
    expect(refusal({ chainId: 8453, transaction: { ...PREPARED.transaction, chainId: 8453 } }, CLAIM)).toBe('chain')
  })

  // Both are consumed and neither may drift: the envelope drives the chain switch, the
  // transaction's own field is what gets signed.
  it('refuses a settle whose envelope and transaction disagree on the chain', () => {
    expect(refusal({ ...PREPARED, chainId: 8453 }, CLAIM)).toBe('chain')
    expect(refusal(served({ chainId: 8453 }), CLAIM)).toBe('chain')
  })

  // `data` is the one field a claim and a refund do NOT differ on elsewhere, so crossed calldata
  // clears every other guard and puts a withdrawal behind a dialog that says "Claim".
  it('refuses refund calldata answering a claim, and claim calldata answering a refund', () => {
    expect(refusal(served({ data: EXIT_DATA }), CLAIM)).toBe('data')
    expect(refusal(served({ data: CLAIM_DATA }), REFUND)).toBe('data')
  })

  // A bare '0x' carries no selector: a signable no-op the dialog would report as a settled claim.
  it('refuses calldata too short to carry a selector', () => {
    for (const data of ['0x', '0xfeed']) {
      expect(refusal(served({ data }), CLAIM)).toBe('data')
    }
  })

  it('accepts every encoding each settle may legitimately answer with', () => {
    for (const data of [CLAIM_DATA, CLAIM_BATCH_ONE_DATA]) {
      expect(refusal(served({ data }), CLAIM)).toBeUndefined()
    }
    for (const data of [EXIT_DATA, EXIT_PARTIAL_DATA]) {
      expect(refusal(served({ data }), REFUND)).toBeUndefined()
    }
  })

  // `claimTokensBatch(address _owner, uint256[])` SENDS the claimed tokens to `_owner`, which is not
  // the transaction sender — a substituted response pays someone else at the user's expense.
  it('refuses a batch claim paying out to another owner', () => {
    const data = backendClaimBatch(OTHER, [41n])
    expect(refusal(served({ data }), CLAIM)).toBe('owner')
  })

  // An N>1 request answered with single-bid `claimTokens(uint256)` settles one bid while the dialog
  // reports the whole claim done.
  it('refuses a multi-bid claim answered with single-bid calldata', () => {
    expect(refusal(PREPARED, CLAIM_MULTI)).toBe('arity')
  })

  it('refuses a multi-bid claim answered with a batch that drops a bid', () => {
    expect(refusal(served({ data: backendClaimBatch(WALLET, [41n]) }), CLAIM_MULTI)).toBe('bids')
  })

  it('refuses a batch that substitutes a bid the request never named', () => {
    expect(refusal(served({ data: backendClaimBatch(WALLET, [41n, 99n]) }), CLAIM_MULTI)).toBe('bids')
  })

  // A repeated requested id must not absorb an unrequested served one.
  it('refuses a batch whose duplicate hides an unrequested bid', () => {
    expect(refusal(served({ data: backendClaimBatch(WALLET, [41n, 99n]) }), { ...CLAIM, bidIds: ['41', '41'] })).toBe(
      'bids',
    )
  })

  // `exitBid(<another of the signer's own open bids>)` does not revert: money out of the wrong
  // position, with no failure for anyone to notice.
  it('refuses a refund answered with a different bid id', () => {
    expect(refusal(served({ data: backendExitOne(99n) }), REFUND)).toBe('bids')
  })

  it('refuses a partial refund answered with a different bid id', () => {
    const data = backendExitPartial(99n, { lastFullyFilledCheckpointBlock: 19_000_000n, outbidBlock: 19_000_100n })
    expect(refusal(served({ data }), REFUND)).toBe('bids')
  })

  it('refuses a single-bid claim answered with a different bid id', () => {
    expect(refusal(served({ data: backendClaimOne(99n) }), CLAIM)).toBe('bids')
  })

  it('accepts a single-bid settle matching a non-normalized requested id', () => {
    expect(refusal(PREPARED, { ...CLAIM, bidIds: ['041'] })).toBeUndefined()
  })

  it('accepts a batch that names the same bids in another order', () => {
    expect(refusal(served({ data: backendClaimBatch(WALLET, [42n, 41n]) }), CLAIM_MULTI)).toBeUndefined()
  })

  it('accepts a batch matching a non-normalized requested id', () => {
    expect(refusal(served({ data: CLAIM_BATCH_DATA }), { ...CLAIM, bidIds: ['041', '42'] })).toBeUndefined()
  })

  // BigInt parses hex and trims whitespace; the combined path refuses both, so this one must too.
  it.each(['0x29', ' 41 '])('refuses a requested id that is not a plain decimal (%j)', (bidId) => {
    expect(refusal(PREPARED, { ...CLAIM, bidIds: [bidId] })).toBe('bids')
    expect(refusal(served({ data: EXIT_DATA }), { ...REFUND, bidId })).toBe('bids')
  })

  it('accepts a multi-bid claim answered with batch calldata', () => {
    expect(refusal(served({ data: CLAIM_BATCH_DATA }), CLAIM_MULTI)).toBeUndefined()
  })

  // shouldClaimAll flips the encoder onto the batch form even for one bid.
  it('accepts a single-bid claim answered with batch calldata', () => {
    expect(refusal(served({ data: CLAIM_BATCH_ONE_DATA }), CLAIM)).toBeUndefined()
  })

  it('accepts a batch claim whose owner matches in a different casing', () => {
    expect(refusal(served({ data: backendClaimBatch(WALLET_LOWER, [41n]) }), CLAIM)).toBeUndefined()
  })

  // The owner check must stay scoped to the batch branch: the other encodings carry no address.
  it('leaves the encodings with no owner argument untouched', () => {
    expect(refusal(served({ data: CLAIM_DATA }), CLAIM, OTHER)).toBeUndefined()
    for (const data of [EXIT_DATA, EXIT_PARTIAL_DATA]) {
      expect(refusal(served({ data }), REFUND, OTHER)).toBeUndefined()
    }
  })

  it('refuses a malformed target as a typed guard failure', () => {
    expect(refusal(served({ to: 'not-an-address' }), CLAIM)).toBe('target')
  })

  it('accepts the named contract in a different casing', () => {
    expect(refusal(served({ to: AUCTION.toLowerCase() }), CLAIM)).toBeUndefined()
  })
})

describe('assertSettleCalldata: combined method', () => {
  const combined = (transaction: Partial<PreparedSettleTransaction['transaction']>): PreparedSettleTransaction =>
    served(transaction, PREPARED_COMBINED)

  it('signs the honest batch', () => {
    expect(refusal(PREPARED_COMBINED, COMBINED_CLAIM)).toBeUndefined()
  })

  it('refuses value and chain on the combined method too', () => {
    expect(refusal(combined({ value: '0x1' }), COMBINED_CLAIM)).toBe('value')
    expect(refusal(combined({ chainId: 8453 }), COMBINED_CLAIM)).toBe('chain')
  })

  it('refuses a `to` that is neither the auction contract nor Multicall3', () => {
    expect(refusal(combined({ to: OTHER }), COMBINED_CLAIM)).toBe('target')
  })

  it('refuses an inner call aimed at another contract', () => {
    const data = multicallData([
      { target: AUCTION, allowFailure: false, callData: backendExitOne(41n) },
      { target: OTHER, allowFailure: false, callData: backendClaimBatch(WALLET, [41n, 42n]) },
    ])
    expect(refusal(combined({ data }), COMBINED_CLAIM)).toBe('target')
  })

  it('refuses a batch with an extra bid, and one that drops a bid', () => {
    for (const exits of [[41n, 99n], [] as bigint[]]) {
      const data = multicallData([
        ...exits.map((bidId) => ({ target: AUCTION, allowFailure: false, callData: backendExitOne(bidId) })),
        { target: AUCTION, allowFailure: false, callData: backendClaimBatch(WALLET, [41n, 42n]) },
      ])
      expect(refusal(combined({ data }), COMBINED_CLAIM)).toBe('bids')
    }
  })

  // The owner is the LIVE account the caller already proved equal to the prepared `from`.
  it('refuses a claim leg paying out to someone other than the live account', () => {
    expect(refusal(PREPARED_COMBINED, COMBINED_CLAIM, OTHER)).toBe('owner')
  })

  it('refuses allowFailure on a settle call', () => {
    const data = multicallData([
      { target: AUCTION, allowFailure: true, callData: backendExitOne(41n) },
      { target: AUCTION, allowFailure: false, callData: backendClaimBatch(WALLET, [41n, 42n]) },
    ])
    expect(refusal(combined({ data }), COMBINED_CLAIM)).toBe('allowFailure')
  })

  it('refuses a nested multicall', () => {
    const data = multicallData([{ target: AUCTION, allowFailure: false, callData: COMBINED_DATA }])
    expect(refusal(combined({ data }), COMBINED_CLAIM)).toBe('data')
  })

  it('refuses a claim leg answering a refund request', () => {
    expect(refusal(PREPARED_COMBINED, { ...COMBINED_CLAIM, kind: 'refund' })).toBe('bids')
  })

  it('refuses the ownerless claimTokens encoding inside a wrapped batch', () => {
    const data = multicallData([
      { target: AUCTION, allowFailure: false, callData: backendExitOne(41n) },
      { target: AUCTION, allowFailure: false, callData: backendClaimOne(41n) },
    ])
    expect(refusal(combined({ data }), { ...COMBINED_CLAIM, bids: [{ bidId: '41', isExited: false }] })).toBe('owner')
  })

  it('still signs a direct-to-auction claimTokens answer', () => {
    expect(
      refusal(combined({ to: AUCTION, data: backendClaimOne(41n) }), {
        ...COMBINED_CLAIM,
        bids: [{ bidId: '41', isExited: true }],
      }),
    ).toBeUndefined()
  })

  it('accepts the migrate bundle: fallible, unknown target, initializer = this auction', () => {
    const data = multicallData([
      { target: AUCTION, allowFailure: false, callData: backendExitOne(41n) },
      { target: AUCTION, allowFailure: false, callData: backendClaimBatch(WALLET, [41n, 42n]) },
      { target: '0xcc00000000000000000000000000000000000003', allowFailure: true, callData: migrateData(AUCTION) },
    ])
    expect(refusal(combined({ data }), COMBINED_CLAIM)).toBeUndefined()
  })
})

describe('assertSomethingToSettle', () => {
  it('refuses a claim naming no bid', () => {
    expect(() => assertSomethingToSettle({ ...CLAIM, bidIds: [] })).toThrow(NothingToSettleError)
  })

  // `BigInt('')` and `BigInt(' ')` are both 0n, so a blank id encodes bid 0 instead of throwing.
  it.each(['', '   '])('refuses a refund naming no bid (%j)', (bidId) => {
    expect(() => assertSomethingToSettle({ ...REFUND, bidId })).toThrow(NothingToSettleError)
  })

  it.each(['', '   '])('refuses a claim whose batch carries a blank bid id (%j)', (bidId) => {
    expect(() => assertSomethingToSettle({ ...CLAIM, bidIds: ['41', bidId] })).toThrow(NothingToSettleError)
  })

  it('refuses a combined settle naming no bid, or a blank one', () => {
    expect(() => assertSomethingToSettle({ ...COMBINED_CLAIM, bids: [] })).toThrow(NothingToSettleError)
    expect(() => assertSomethingToSettle({ ...COMBINED_CLAIM, bids: [{ bidId: ' ', isExited: false }] })).toThrow(
      NothingToSettleError,
    )
  })

  it('runs inside assertSettleCalldata, which an empty claim answered with an empty batch would pass', () => {
    const prepared = served({ data: backendClaimBatch(WALLET, []) })
    expect(() => assertSettleCalldata({ prepared, request: { ...CLAIM, bidIds: [] }, owner: WALLET })).toThrow(
      NothingToSettleError,
    )
  })

  it('names the kind it refused', () => {
    expect(() => assertSomethingToSettle({ ...REFUND, bidId: '' })).toThrow(new NothingToSettleError('refund'))
  })

  // The counterpart, so the guard cannot be "refuse everything".
  it('passes a settle naming real bids', () => {
    expect(() => assertSomethingToSettle(REFUND)).not.toThrow()
    expect(() => assertSomethingToSettle(CLAIM_MULTI)).not.toThrow()
    expect(() => assertSomethingToSettle(COMBINED_CLAIM)).not.toThrow()
  })
})

describe('settle selectors', () => {
  it('match the backend encoders exactly', () => {
    expect([...SETTLE_SELECTORS.claim].sort()).toEqual(
      [BACKEND_SETTLE_SELECTORS.claimTokens, BACKEND_SETTLE_SELECTORS.claimTokensBatch].sort(),
    )
    expect([...SETTLE_SELECTORS.refund].sort()).toEqual(
      [BACKEND_SETTLE_SELECTORS.exitBid, BACKEND_SETTLE_SELECTORS.exitPartiallyFilledBid].sort(),
    )
  })

  // If the decode ABI drifted from the real signature, the owner check would silently never run.
  it('pins the batch decode ABI to the backend signature, so the owner guard cannot fail open', () => {
    expect(BATCH_CLAIM_SELECTOR).toBe(BACKEND_SETTLE_SELECTORS.claimTokensBatch)
    expect(SETTLE_SELECTORS.claim).toContain(BATCH_CLAIM_SELECTOR)
  })
})

describe('assertExitAndClaimCalldata', () => {
  const EITHER = {
    kind: 'either' as const,
    auctionContractAddress: AUCTION,
    chainId: CHAIN_ID,
    bids: [
      { bidId: '41', isExited: false },
      { bidId: '42', isExited: true },
    ],
  }
  const check = (prepared: PreparedSettleTransaction, owner: string = WALLET): string | undefined => {
    try {
      assertExitAndClaimCalldata({ prepared, request: EITHER, owner })
      return undefined
    } catch (error) {
      if (error instanceof UnsignableSettleError) {
        return error.reason
      }
      throw error
    }
  }

  it('signs the honest batch, with or without the claim leg', () => {
    expect(check(PREPARED_COMBINED)).toBeUndefined()
    expect(check(served({ to: AUCTION, data: backendExitOne(41n) }, PREPARED_COMBINED))).toBeUndefined()
  })

  it('keeps the header rules and the owner rule', () => {
    expect(check(served({ value: '0x1' }, PREPARED_COMBINED))).toBe('value')
    expect(check({ ...PREPARED_COMBINED, chainId: 8453 })).toBe('chain')
    expect(check(served({ chainId: 8453 }, PREPARED_COMBINED))).toBe('chain')
    expect(check(served({ to: OTHER }, PREPARED_COMBINED))).toBe('target')
    expect(check(PREPARED_COMBINED, OTHER)).toBe('owner')
  })

  // Callable without assertSettleCalldata, whose empty-request guard would otherwise be skipped.
  it.each(['either', 'claim', 'refund'] as const)('refuses a %s request naming no bid, or a blank one', (kind) => {
    const emptyClaim = served({ to: AUCTION, data: backendClaimBatch(WALLET, []) }, PREPARED_COMBINED)
    expect(() =>
      assertExitAndClaimCalldata({ prepared: emptyClaim, request: { ...EITHER, kind, bids: [] }, owner: WALLET }),
    ).toThrow(new NothingToSettleError(kind))
    expect(() =>
      assertExitAndClaimCalldata({
        prepared: PREPARED_COMBINED,
        request: { ...EITHER, kind, bids: [...EITHER.bids, { bidId: ' ', isExited: true }] },
        owner: WALLET,
      }),
    ).toThrow(NothingToSettleError)
  })
})
