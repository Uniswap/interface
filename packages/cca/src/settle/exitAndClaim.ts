import { decodeFunctionData, getAddress, type Hex, parseAbi } from 'viem'

/**
 * Calldata verification for the COMBINED settle (liquidity ExitBidAndClaimTokens).
 *
 * The service answers with either a direct auction-contract call (one operation) or a Multicall3
 * `aggregate3` batch (several), so "what does this transaction DO" is not one selector: it is a
 * LIST of inner calls, each with its own target, failure policy and arguments. Every dimension of
 * that list is compared against the request here.
 *
 * One implementation for every guard layer on purpose (a server-side check, and the signing
 * boundary after the HTTP hop): the RULES are identical, and two transcriptions of a multiset
 * comparison drift. Layers differ only in what they compare the batch owner against and in which
 * error class carries the refusal, so the owner is a parameter and the refusal is a reason code.
 *
 * What the rules are, and why each is load-bearing:
 *  - OUTER `to` is the auction contract (single call) or exactly Multicall3. Anything else is an
 *    arbitrary contract call behind a dialog saying "Claim".
 *  - Every allowFailure=false inner call must target the requested auction contract and decode to
 *    one of the four settle encodings. Multicall3 forwards calls verbatim, so one foreign inner call
 *    is one arbitrary call the user signs — including a NESTED aggregate3, refused by the same decode.
 *  - The exit-encoded bid ids must equal the requested NON-EXITED bids as a multiset, and the claim
 *    call's ids the FULL requested multiset — the backend's own construction
 *    (ExitBidAndClaimTokensBL.ts builds exits from `!isExited` and claims ALL bids), so a served set
 *    that disagrees is the service answering about different bids. Multiset, not set: nothing
 *    dedupes on either side, so a repeated requested id could otherwise absorb an unrequested one.
 *  - `claimTokensBatch`'s `_owner` must equal the expected owner. The contract pays `_owner` and
 *    reverts unless every listed bid is stored as owned by it, so a substituted owner settles someone
 *    else's bids on the user's gas while the dialog reports theirs claimed. `claimTokens(uint256)`
 *    names no owner (the contract pays the bid's STORED owner, whoever calls), so there is nothing
 *    here to check it against: it is refused INSIDE a wrapped batch, a shape the combined path never
 *    emits (it always claims via `claimTokensBatch`). A direct `to === auction` answer keeps
 *    admitting it, since that is how a one-bid claim is encoded.
 *  - A claim request must contain exactly one claim call and a refund request none. `data` is the
 *    only field the two kinds differ on, and on this method the difference is the PRESENCE of the
 *    claim leg: exits-only calldata answering a claim puts a refund behind a dialog saying "Claim",
 *    and a claim leg answering a refund adds a transfer the user never reviewed. An `either` request
 *    admits at most one claim call: for callers that leave the claim decision to the service (it adds
 *    the leg once the auction is over and graduated, by its own finalization-aware reading), where
 *    predicting the leg wrong would refuse a legitimate withdrawal. Every other rule still holds, so
 *    a claim leg that is present must pay the owner for exactly the requested bids.
 *  - `allowFailure` must be false on every settle call (a fallible exit turns "all or nothing" into
 *    "silently partial"). The ONE fallible call admitted is the backend's opportunistic LBP
 *    `migrate(initializer)` bundle: it must decode as exactly that, naming the requested auction
 *    contract as initializer. Its TARGET is deliberately unchecked: the served target is the
 *    AUCTION'S OWN `fundsRecipient()`, resolved on-chain per auction, and the backend supports any
 *    deployed strategy instance — pinning it to an SDK singleton would refuse legitimate migrates.
 *    The call can move nothing of the user's either way: aggregate3 forwards no value to inner calls,
 *    the outer value is pinned to zero, and the calldata names only the auction.
 */

/** Multicall3's canonical deployment, the same address on every major chain — matches the
 * backend's MULTICALL3_ADDRESS (lib/contracts/auction.ts). */
export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'

/** One bid of a combined settle request — the proto's BidToExit shape. */
export interface SettleBidRef {
  bidId: string
  /** Whether the bid's budget already exited on-chain. The backend builds exit calldata only for
   * the `false` ones. */
  isExited: boolean
}

/** Multicall3.aggregate3, transcribed from the backend's own inline ABI (lib/contracts/auction.ts). */
const AGGREGATE3_ABI = parseAbi([
  'struct Call3 { address target; bool allowFailure; bytes callData; }',
  'function aggregate3(Call3[] calls) payable returns ((bool success, bytes returnData)[] returnData)',
])

/** The four settle encodings. */
const SETTLE_CALL_ABI = parseAbi([
  'function claimTokens(uint256 bidId)',
  'function claimTokensBatch(address owner, uint256[] bidIds)',
  'function exitBid(uint256 bidId)',
  'function exitPartiallyFilledBid(uint256 bidId, uint64 lastFullyFilledCheckpointBlock, uint64 outbidBlock)',
])

/** The LBP strategy's `migrate(ILBPInitializer initializer)` — backend encodeMigrate
 * (lib/contracts/auction.ts), ABI LbpStrategies.json. */
const MIGRATE_ABI = parseAbi(['function migrate(address initializer)'])

export type ExitAndClaimRefusal = 'target' | 'selector' | 'arguments' | 'owner' | 'allowFailure'

export interface RequestedExitAndClaim {
  /** Whether the claim leg must be present (`claim`), absent (`refund`), or may be either. */
  kind: 'claim' | 'refund' | 'either'
  auctionContractAddress: string
  /** What `claimTokensBatch`'s `_owner` must equal: the requested wallet server-side, the LIVE
   * connected account at the signing boundary. */
  owner: string
  bids: readonly SettleBidRef[]
}

/** Checksum-normalized; a malformed side is a mismatch, never a throw — at a guard, an unparseable
 * served address is a refusal. */
function sameAddress(left: string, right: string): boolean {
  try {
    return getAddress(left) === getAddress(right)
  } catch {
    return false
  }
}

/**
 * Decimal-normalized multiset equality ('41' and '041' are one bid; the decode side is bigints).
 * Requested ids that are not plain decimals fail CLOSED: BigInt also parses hex, so folding '0x29'
 * onto '41' would invent an equivalence the contract never accepts — a request this cannot
 * normalize is one it cannot verify the answer against. Shared with the single-purpose guard so both
 * paths answer the same request the same way.
 */
export function sameBidMultiset(served: readonly bigint[], requested: readonly string[]): boolean {
  if (!requested.every((bidId) => /^\d{1,78}$/.test(bidId))) {
    return false
  }
  const normalized = requested.map((bidId) => BigInt(bidId).toString()).sort()
  const answered = served.map((bid) => bid.toString()).sort()
  return answered.length === normalized.length && answered.every((bidId, index) => bidId === normalized[index])
}

/**
 * Whole-byte 0x calldata long enough to carry a selector: the server-side check's rule (CALLDATA_RE
 * plus even length), here so a caller with no server layer in front refuses the same answers.
 */
export function isWholeByteCalldata(data: string): boolean {
  return /^0x[0-9a-fA-F]{8,}$/.test(data) && data.length % 2 === 0
}

interface InnerCall {
  target: string
  allowFailure: boolean
  callData: string
}

/** The batch unwrapped to inner calls — a direct auction-contract call is the one-element,
 * must-succeed case of the same list. */
function toInnerCalls(
  served: { to: string; data: string },
  auctionContractAddress: string,
): InnerCall[] | ExitAndClaimRefusal {
  if (sameAddress(served.to, auctionContractAddress)) {
    return [{ target: served.to, allowFailure: false, callData: served.data }]
  }
  if (!sameAddress(served.to, MULTICALL3_ADDRESS)) {
    return 'target'
  }
  try {
    const decoded = decodeFunctionData({ abi: AGGREGATE3_ABI, data: served.data as Hex })
    const [calls] = decoded.args as [readonly { target: string; allowFailure: boolean; callData: string }[]]
    return calls.map((call) => ({ target: call.target, allowFailure: call.allowFailure, callData: call.callData }))
  } catch {
    // Addressed to Multicall3 but not an aggregate3 call — nothing else on that contract is a
    // shape this settle may take.
    return 'selector'
  }
}

/**
 * Why the served calldata must be refused, or `undefined` when every rule above holds. Pure and
 * layer-agnostic — the caller maps the reason to its own error class and does its own logging.
 */
export function refuseExitAndClaimCalldata(
  served: { to: string; data: string },
  requested: RequestedExitAndClaim,
): ExitAndClaimRefusal | undefined {
  if (!isWholeByteCalldata(served.data)) {
    return 'selector'
  }
  const inner = toInnerCalls(served, requested.auctionContractAddress)
  if (typeof inner === 'string') {
    return inner
  }
  /** Whether the calls run under aggregate3, where the combined path only ever claims via the
   * batch encoding. */
  const wrapped = sameAddress(served.to, MULTICALL3_ADDRESS)
  const servedExits: bigint[] = []
  const claimCalls: { owner?: string; bidIds: readonly bigint[] }[] = []
  for (const call of inner) {
    if (call.allowFailure) {
      // The one fallible shape admitted: the backend's opportunistic migrate bundle. Anything else
      // free to fail is a policy the settled-bid accounting cannot absorb.
      let initializer: string
      try {
        const decoded = decodeFunctionData({ abi: MIGRATE_ABI, data: call.callData as Hex })
        ;[initializer] = decoded.args as [string]
      } catch {
        return 'allowFailure'
      }
      if (!sameAddress(initializer, requested.auctionContractAddress)) {
        return 'allowFailure'
      }
      continue
    }
    // Must-succeed calls are the settle itself: auction contract only.
    if (!sameAddress(call.target, requested.auctionContractAddress)) {
      return 'target'
    }
    let decoded: { functionName: string; args?: readonly unknown[] }
    try {
      decoded = decodeFunctionData({ abi: SETTLE_CALL_ABI, data: call.callData as Hex })
    } catch {
      // Foreign selector, undecodable arguments, or a nested aggregate3 — all the same verdict:
      // not one of the four calls a settle may encode.
      return 'selector'
    }
    const args = decoded.args ?? []
    if (decoded.functionName === 'exitBid' || decoded.functionName === 'exitPartiallyFilledBid') {
      // Leading bid id only; exitPartiallyFilledBid's two uint64 fill bounds are the service's
      // computed state, deliberately not compared.
      servedExits.push((args as readonly [bigint])[0])
    } else if (decoded.functionName === 'claimTokensBatch') {
      const [owner, bidIds] = args as [string, readonly bigint[]]
      claimCalls.push({ owner, bidIds })
    } else {
      // claimTokens(uint256) carries NO owner argument (the contract pays the bid's stored owner),
      // so the payout cannot be checked from calldata. The combined BL claims a wrapped batch only
      // via claimTokensBatch, so refusing this here costs no legitimate traffic.
      if (wrapped) {
        return 'owner'
      }
      claimCalls.push({ bidIds: [(args as readonly [bigint])[0]] })
    }
  }
  // The claim leg's PRESENCE is what tells the two kinds apart on this method.
  const allowedClaimCalls = requested.kind === 'either' ? [0, 1] : [requested.kind === 'claim' ? 1 : 0]
  if (!allowedClaimCalls.includes(claimCalls.length)) {
    return 'arguments'
  }
  // A batch of only migrates settles nothing — refusing it keeps "the dialog reported a settle that
  // signed a no-op" impossible on this path.
  if (servedExits.length === 0 && claimCalls.length === 0) {
    return 'arguments'
  }
  const expectedExits = requested.bids.filter((bid) => !bid.isExited).map((bid) => bid.bidId)
  if (!sameBidMultiset(servedExits, expectedExits)) {
    return 'arguments'
  }
  const claim = claimCalls[0]
  if (claim !== undefined) {
    if (claim.owner !== undefined && !sameAddress(claim.owner, requested.owner)) {
      return 'owner'
    }
    if (
      !sameBidMultiset(
        claim.bidIds,
        requested.bids.map((bid) => bid.bidId),
      )
    ) {
      return 'arguments'
    }
  }
  return undefined
}
