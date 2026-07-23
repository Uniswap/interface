import { describe, expect, it } from 'vitest'
import { getCreatorSweepDisplay } from '~/features/Toucan/Auction/CreatorActions/getCreatorSweepDisplay'
import { AuctionOutcome } from '~/features/Toucan/Auction/store/types'

const base = {
  outcome: AuctionOutcome.FAILED,
  isConnectedTokensRecipient: true,
  hasSwept: false as boolean | undefined,
  depositedSupplyRaw: 1_000_000n as bigint | undefined,
  remainingSupplyRaw: 250n as bigint | undefined,
}

describe('getCreatorSweepDisplay', () => {
  it('hides the card for wallets other than the tokensRecipient', () => {
    expect(getCreatorSweepDisplay({ ...base, isConnectedTokensRecipient: false })).toBeNull()
  })

  it('hides the card while the auction is active or unknown', () => {
    expect(getCreatorSweepDisplay({ ...base, outcome: AuctionOutcome.ACTIVE })).toBeNull()
    expect(getCreatorSweepDisplay({ ...base, outcome: AuctionOutcome.UNKNOWN })).toBeNull()
  })

  it('hides the card until the sweep latch has been read', () => {
    expect(getCreatorSweepDisplay({ ...base, hasSwept: undefined })).toBeNull()
  })

  it('failed launch: full deposited supply, sweepable', () => {
    expect(getCreatorSweepDisplay(base)).toEqual({
      variant: 'failed',
      amountRaw: 1_000_000n,
      isSwept: false,
    })
  })

  it('failed launch: stays visible in the done state once swept', () => {
    expect(getCreatorSweepDisplay({ ...base, hasSwept: true })).toEqual({
      variant: 'failed',
      amountRaw: 1_000_000n,
      isSwept: true,
    })
  })

  it('graduated launch: unsold remainder, sweepable', () => {
    expect(getCreatorSweepDisplay({ ...base, outcome: AuctionOutcome.GRADUATED })).toEqual({
      variant: 'graduated',
      amountRaw: 250n,
      isSwept: false,
    })
  })

  it('graduated launch: hidden when everything sold (nothing to sweep)', () => {
    expect(getCreatorSweepDisplay({ ...base, outcome: AuctionOutcome.GRADUATED, remainingSupplyRaw: 0n })).toBeNull()
  })

  it('graduated launch: still shows the done state after sweeping (remainingSupply now 0)', () => {
    expect(
      getCreatorSweepDisplay({ ...base, outcome: AuctionOutcome.GRADUATED, hasSwept: true, remainingSupplyRaw: 0n }),
    ).toEqual({ variant: 'graduated', amountRaw: 0n, isSwept: true })
  })

  it('graduated launch: renders with a loading amount while remainingSupply is pending', () => {
    expect(
      getCreatorSweepDisplay({ ...base, outcome: AuctionOutcome.GRADUATED, remainingSupplyRaw: undefined }),
    ).toEqual({ variant: 'graduated', amountRaw: undefined, isSwept: false })
  })
})
