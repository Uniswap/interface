import { decodeFunctionData, getAddress, type Hex, parseAbi, toFunctionSelector } from 'viem'
import {
  type ExitAndClaimRefusal,
  isWholeByteCalldata,
  refuseExitAndClaimCalldata,
  type RequestedExitAndClaim,
  type SettleBidRef,
  sameBidMultiset,
} from './exitAndClaim'

/**
 * One settle transaction. The `bids` shapes are the COMBINED method (ExitBidAndClaimTokens): a
 * batch of `{ bidId, isExited }` on one auction, one signature. The `bidId` shape is the single-bid
 * exit (ExitBidPosition), and the `bidIds` shape the single-purpose ClaimTokens.
 */
export type SettleRequest =
  | { kind: 'claim'; auctionContractAddress: string; chainId: number; bids: SettleBidRef[] }
  | { kind: 'refund'; auctionContractAddress: string; chainId: number; bids: SettleBidRef[] }
  | {
      kind: 'claim'
      auctionContractAddress: string
      chainId: number
      /** The position's open bid ids — never one already settled. */
      bidIds: string[]
    }
  | { kind: 'refund'; auctionContractAddress: string; chainId: number; bidId: string }

/** The served transaction a settle request was answered with, as it would be signed. */
export interface PreparedSettleTransaction {
  /** The chain the prepared envelope names. */
  chainId: number
  transaction: { to: string; data: string; value: string; chainId: number }
}

/**
 * The prepared transaction disagrees with the settle it answers. Server-built calldata reaches the
 * wallet over an HTTP hop, and the client cannot observe whether any server-side guard ran, so this
 * is checked again at the signing boundary.
 */
export class UnsignableSettleError extends Error {
  /**
   * `owner`: the batch claim pays someone other than the signer. `arity`: the response used an
   * ENCODING that cannot carry the request (a multi-bid claim answered single-bid). `bids`: it
   * decodes but names a different SET of bids than was asked for — the count can match exactly and
   * the ids still be wrong, which is why that is not `arity`. `allowFailure`: a Multicall3 inner
   * call's failure policy disagrees with the settle's atomicity (see exitAndClaim.ts).
   */
  constructor(readonly reason: 'target' | 'value' | 'chain' | 'data' | 'owner' | 'arity' | 'bids' | 'allowFailure') {
    super(`The prepared settle disagrees with the request on ${reason}`)
    this.name = 'UnsignableSettleError'
  }
}

/**
 * The only calls either single-purpose settle may encode, by selector — derived with
 * `toFunctionSelector` from the backend signatures, never hardcoded. A claim encodes `claimTokens`
 * or, under shouldClaimAll, `claimTokensBatch`; a refund `exitBid` or `exitPartiallyFilledBid`.
 */
export const SETTLE_SELECTORS: Record<SettleRequest['kind'], readonly string[]> = {
  claim: [
    toFunctionSelector('function claimTokens(uint256)'),
    toFunctionSelector('function claimTokensBatch(address,uint256[])'),
  ],
  refund: [
    toFunctionSelector('function exitBid(uint256)'),
    toFunctionSelector('function exitPartiallyFilledBid(uint256,uint64,uint64)'),
  ],
}

/** The one settle encoding that names a payout address. */
const BATCH_CLAIM_ABI = parseAbi(['function claimTokensBatch(address owner, uint256[] bidIds)'])
/**
 * The other three encodings, all leading with the bid id. Decoded for that ONE argument because on
 * the refund leg a substituted id does not revert: `exitBid` on another of the signer's own open
 * bids is a well-formed exit of a live position, so the wallet signs it, it succeeds, and the
 * dialog reports the bid the user asked about as settled. Money moves, wrong position, nothing
 * fails.
 */
const SINGLE_BID_ABI = parseAbi([
  'function claimTokens(uint256 bidId)',
  'function exitBid(uint256 bidId)',
  'function exitPartiallyFilledBid(uint256 bidId, uint64 lastFullyFilledCheckpointBlock, uint64 outbidBlock)',
])
/** Derived from the decode ABI, not re-typed: a hand-written copy would stop matching if the batch
 * signature changed, and the owner check would then silently never run — failing OPEN. */
export const BATCH_CLAIM_SELECTOR = toFunctionSelector(BATCH_CLAIM_ABI[0])

/** The combined method's refusals in this class's vocabulary: an inner call the batch may not
 * contain is `data` (like a foreign selector), a bid-set disagreement is `bids`, and the rest carry
 * their own names. */
const EXIT_AND_CLAIM_REFUSAL_REASONS: Record<ExitAndClaimRefusal, UnsignableSettleError['reason']> = {
  target: 'target',
  selector: 'data',
  arguments: 'bids',
  owner: 'owner',
  allowFailure: 'allowFailure',
}

/** Settles are pull-only, so zero is the one value to accept, in the server-side check's spellings
 * ('', '0', '0x', '0x0', '0x00'). Anything else, '-0' or ' 0' or '0b0' included, is refused. */
function isZeroValue(value: string): boolean {
  return /^(0x)?0*$/.test(value)
}

/** The leading 4 bytes, lowercased to match `toFunctionSelector`'s output. `undefined` unless the
 * calldata is whole-byte hex carrying a selector — a bare '0x' encodes a no-op the dialog would then
 * report as settled, and an odd trailing digit is not calldata a wallet should be handed. */
function settleSelector(data: string): string | undefined {
  return isWholeByteCalldata(data) ? data.slice(0, 10).toLowerCase() : undefined
}

/** Checksum-normalized. viem throws on a malformed address; at a signing boundary that is a
 * refusal, so it is caught and surfaced as the typed guard failure instead. */
function sameAddress(left: string, right: string): boolean {
  try {
    return getAddress(left) === getAddress(right)
  } catch {
    return false
  }
}

/**
 * The leading bid id, against the one the request named. The two `uint64` fill bounds are
 * deliberately NOT compared: they are the service's computed fill state, and inventing a bound
 * would be worse than the gap.
 */
function assertSingleBidCall(data: string, bidIds: string[]): void {
  let servedBidId: bigint
  try {
    const decoded = decodeFunctionData({ abi: SINGLE_BID_ABI, data: data as Hex })
    ;[servedBidId] = decoded.args as [bigint]
  } catch {
    throw new UnsignableSettleError('data')
  }
  if (!sameBidMultiset([servedBidId], bidIds)) {
    throw new UnsignableSettleError('bids')
  }
}

/**
 * The batch claim's two served arguments, both of which decide where value goes. `_owner` must be
 * the account that SIGNS. The bid ARRAY must be the set asked for: a multi-bid claim answered with a
 * SHORTER batch clears every other guard and the dialog reports every requested bid settled while
 * some were never in the transaction.
 */
function assertBatchClaimCall({ data, owner, bidIds }: { data: string; owner: string; bidIds: string[] }): void {
  let servedOwner: string
  let servedBids: readonly bigint[]
  try {
    const decoded = decodeFunctionData({ abi: BATCH_CLAIM_ABI, data: data as Hex })
    ;[servedOwner, servedBids] = decoded.args as [string, readonly bigint[]]
  } catch {
    // Valid selector, undecodable arguments — still a response not to sign.
    throw new UnsignableSettleError('data')
  }
  if (!sameAddress(servedOwner, owner)) {
    throw new UnsignableSettleError('owner')
  }
  if (!sameBidMultiset(servedBids, bidIds)) {
    throw new UnsignableSettleError('bids')
  }
}

/** The settle names no bid, so there is nothing to sign. An empty batch would encode a no-op the
 * dialog would then report as a successful claim of nothing. */
export class NothingToSettleError extends Error {
  /** `either`: a combined settle that left the claim leg to the service. */
  constructor(readonly kind: RequestedExitAndClaim['kind']) {
    super(`${kind === 'either' ? 'A refund or claim' : `A ${kind}`} was requested with no bid to settle`)
    this.name = 'NothingToSettleError'
  }
}

function isBlankBidId(bidId: string): boolean {
  return bidId.trim() === ''
}

function assertBidsToSettle(kind: NothingToSettleError['kind'], bids: readonly SettleBidRef[]): void {
  if (bids.length === 0 || bids.some((bid) => isBlankBidId(bid.bidId))) {
    throw new NothingToSettleError(kind)
  }
}

/** Refuses a settle request that names no bid — before anything is prepared or signed. */
export function assertSomethingToSettle(request: SettleRequest): void {
  // A blank bid id is the single-bid equivalent of an empty batch, and it does not announce itself:
  // `BigInt('')` and `BigInt(' ')` are both `0n`, so it encodes bid 0 — a bid the wallet never
  // owned — instead of throwing. Checked per id on every batched leg, not just on the batch's
  // length: a blank inside a non-empty batch passes a length check untouched.
  if ('bids' in request) {
    assertBidsToSettle(request.kind, request.bids)
    return
  }
  if ('bidIds' in request) {
    if (request.bidIds.length === 0 || request.bidIds.some(isBlankBidId)) {
      throw new NothingToSettleError('claim')
    }
    return
  }
  if (isBlankBidId(request.bidId)) {
    throw new NothingToSettleError('refund')
  }
}

/**
 * The COMBINED method's checks (ExitBidAndClaimTokens): the value and chain header rules, then the
 * whole-batch verification, which decodes every inner call. The `to` rule differs from the
 * single-purpose settles by construction (auction contract OR exactly Multicall3) and belongs to
 * the batch verification. Throws {@link UnsignableSettleError}, or {@link NothingToSettleError} for a
 * request naming no bid.
 *
 * `kind: 'either'` is for callers that do not decide whether the claim leg is included — see
 * {@link RequestedExitAndClaim}.
 */
export function assertExitAndClaimCalldata({
  prepared,
  request,
  owner,
}: {
  prepared: PreparedSettleTransaction
  request: {
    kind: RequestedExitAndClaim['kind']
    auctionContractAddress: string
    chainId: number
    bids: SettleBidRef[]
  }
  /** The LIVE connected account — the payout address the claim leg must name. */
  owner: string
}): void {
  // Checked here too because this is callable without assertSettleCalldata: an empty request
  // answered with `claimTokensBatch(owner, [])` passes every check below in `claim` and `either`.
  assertBidsToSettle(request.kind, request.bids)
  const { transaction } = prepared
  if (!isZeroValue(transaction.value)) {
    throw new UnsignableSettleError('value')
  }
  if (prepared.chainId !== request.chainId || transaction.chainId !== request.chainId) {
    throw new UnsignableSettleError('chain')
  }
  const refusal = refuseExitAndClaimCalldata(
    { to: transaction.to, data: transaction.data },
    { kind: request.kind, auctionContractAddress: request.auctionContractAddress, owner, bids: request.bids },
  )
  if (refusal !== undefined) {
    throw new UnsignableSettleError(EXIT_AND_CLAIM_REFUSAL_REASONS[refusal])
  }
}

/**
 * Every served-field check between a prepared settle and the wallet, after the caller has proven
 * the prepared `from` is the connected account (`owner`). Throws {@link UnsignableSettleError}, or
 * {@link NothingToSettleError} for a request naming no bid.
 *
 * ORDER IS BEHAVIOUR, not style: the selector allow-list is what makes the arity and argument checks
 * meaningful, and reordering changes which reason a bad response produces.
 */
export function assertSettleCalldata({
  prepared,
  request,
  owner,
}: {
  prepared: PreparedSettleTransaction
  request: SettleRequest
  /** The LIVE connected account — the payout address a batch claim must name. */
  owner: string
}): void {
  // Re-checked here so no caller can skip it: an empty request answered with an empty batch passes
  // every check below.
  assertSomethingToSettle(request)
  const { transaction } = prepared
  if ('bids' in request) {
    assertExitAndClaimCalldata({ prepared, request, owner })
    return
  }
  // A substituted `to` means the user approves an arbitrary contract call under a dialog that says
  // "Claim"; a non-zero `value` means they send ether with it. Both single-purpose RPCs are
  // pull-only calls on the auction contract (backend ExitBidPositionBL / ClaimTokensBL set
  // `to: auctionContractAddress` directly), so both are always wrong.
  if (!sameAddress(transaction.to, request.auctionContractAddress)) {
    throw new UnsignableSettleError('target')
  }
  if (!isZeroValue(transaction.value)) {
    throw new UnsignableSettleError('value')
  }
  // Auction addresses are deterministic across chains, so a substituted chain is not a revert
  // waiting to happen: it is a well-formed call to the same-address deployment on the WRONG network,
  // under a dialog naming this one.
  if (prepared.chainId !== request.chainId || transaction.chainId !== request.chainId) {
    throw new UnsignableSettleError('chain')
  }
  // `data` is the one field a claim and a refund do not already differ on: same sender, contract,
  // chain, zero value. The selector tells the two apart; the arguments are compared below.
  const selector = settleSelector(transaction.data)
  if (selector === undefined || !SETTLE_SELECTORS[request.kind].includes(selector)) {
    throw new UnsignableSettleError('data')
  }
  // Per-ARITY before the argument checks, so a wrong-ENCODING answer keeps its own diagnosis. An
  // N>1 request answered with single-bid `claimTokens(uint256)` settles one bid while the dialog
  // reports the whole claim done. The converse is NOT asserted — shouldClaimAll batches one bid too.
  if (request.kind === 'claim' && request.bidIds.length > 1 && selector !== BATCH_CLAIM_SELECTOR) {
    throw new UnsignableSettleError('arity')
  }
  // Branch-scoped because only the batch encoding carries an address argument.
  const requestedBidIds = request.kind === 'claim' ? request.bidIds : [request.bidId]
  if (selector === BATCH_CLAIM_SELECTOR) {
    assertBatchClaimCall({ data: transaction.data, owner, bidIds: requestedBidIds })
  } else {
    assertSingleBidCall(transaction.data, requestedBidIds)
  }
}
