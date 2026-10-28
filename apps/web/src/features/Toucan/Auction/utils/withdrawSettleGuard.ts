import { assertExitAndClaimCalldata, assertSettleCalldata, type SettleBidRef } from '@universe/cca'
import { areEvmAddressesEqual } from '@universe/chains'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

/** What a withdraw asked the liquidity service to build — the shape its answer is checked against. */
export type WithdrawSettleRequest =
  /** ExitBidPosition: the pre-claim-window exit of one bid. */
  | { method: 'exitBidPosition'; auctionContractAddress: string; chainId: number; bidId: string }
  /** ExitBidAndClaimTokens: exit every non-exited bid, and claim them all once the auction graduated. */
  | { method: 'exitBidAndClaimTokens'; auctionContractAddress: string; chainId: number; bids: SettleBidRef[] }

/**
 * The transaction the saga signs. Checked as built, not as the service returned it, so a pass always
 * describes what reaches the wallet even if building the request ever normalizes a served field.
 */
export type SignedWithdrawTransaction = Pick<ValidatedTransactionRequest, 'to' | 'from' | 'data' | 'value' | 'chainId'>

/** The prepared withdrawal names a different sender than the wallet about to sign it. */
export class WithdrawSenderMismatchError extends Error {
  constructor() {
    super('The prepared withdrawal was built for a different account than the connected wallet')
    this.name = 'WithdrawSenderMismatchError'
  }
}

/**
 * Refuses server-built withdraw/claim calldata that disagrees with what was requested, before it can
 * be signed: sender, target, value, chain, selector, bid ids and the claim leg's payout owner (the
 * @universe/cca checks Pools runs at its signing boundary). The saga switches the wallet to the
 * served chain and signs the served calldata as-is, so nothing after this point would notice a
 * substituted answer.
 *
 * ExitBidAndClaimTokens is checked with the claim leg optional: the service decides whether to add
 * it (auction over and graduated, by its own finalization-aware reading), and the page's view of
 * graduation can lag that, so predicting the leg would refuse legitimate withdrawals. A leg that is
 * present must still pay `account` for exactly the requested bids.
 */
export function assertSignableWithdraw({
  txRequest,
  request,
  account,
}: {
  txRequest: SignedWithdrawTransaction
  request: WithdrawSettleRequest
  /** The account that will sign — the payout owner a claim leg must name. */
  account: string
}): void {
  if (!areEvmAddressesEqual(txRequest.from, account)) {
    throw new WithdrawSenderMismatchError()
  }
  // ethers types `data` and `value` wider than the strings this flow builds; String() of any other
  // form is not hex or decimal, so it fails the checks below instead of slipping past them.
  const transaction = {
    to: txRequest.to,
    data: String(txRequest.data ?? ''),
    value: String(txRequest.value ?? '0'),
    chainId: txRequest.chainId,
  }
  const prepared = { chainId: txRequest.chainId, transaction }
  if (request.method === 'exitBidPosition') {
    assertSettleCalldata({
      prepared,
      request: {
        kind: 'refund',
        auctionContractAddress: request.auctionContractAddress,
        chainId: request.chainId,
        bidId: request.bidId,
      },
      owner: account,
    })
    return
  }
  assertExitAndClaimCalldata({
    prepared,
    request: {
      kind: 'either',
      auctionContractAddress: request.auctionContractAddress,
      chainId: request.chainId,
      bids: request.bids,
    },
    owner: account,
  })
}
