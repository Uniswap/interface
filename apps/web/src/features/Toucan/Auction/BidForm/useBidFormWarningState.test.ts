import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { describe, expect, it } from 'vitest'
import { zeroAddress } from '~/chains'
import { useBidFormWarningState } from '~/features/Toucan/Auction/BidForm/useBidFormWarningState'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useToucanAuctionSupportedChains } from '~/features/Toucan/supportedChains'
import { getPrimaryStablecoin } from '~/features/Toucan/utils/raiseCurrency'

const ARBITRARY_TOKEN = '0x1234567890123456789012345678901234567890'

function renderWarningState(overrides: {
  chainId?: UniverseChainId
  currency?: string
  auctionProgressState?: AuctionProgressState
  isMaxBidPriceReached?: boolean
  isUnmodeledValidationHook?: boolean
}) {
  const { result } = renderHook(() =>
    useBidFormWarningState({
      chainId: overrides.chainId ?? UniverseChainId.Mainnet,
      currency: overrides.currency ?? zeroAddress,
      auctionProgressState: overrides.auctionProgressState ?? AuctionProgressState.IN_PROGRESS,
      userBids: [],
      isMaxBidPriceReached: overrides.isMaxBidPriceReached,
      isUnmodeledValidationHook: overrides.isUnmodeledValidationHook,
    }),
  )
  return result.current
}

function getWarningState(chainId: UniverseChainId, currency: string): boolean {
  const { result } = renderHook(() =>
    useBidFormWarningState({
      chainId,
      currency,
      auctionProgressState: AuctionProgressState.IN_PROGRESS,
      userBids: [],
    }),
  )
  return result.current.shouldShowWarningBanner
}

describe('useBidFormWarningState', () => {
  it('accepts the native currency (zero address)', () => {
    expect(getWarningState(UniverseChainId.Mainnet, zeroAddress)).toBe(false)
  })

  it('accepts the primary stablecoin on a USDC-keyed chain', () => {
    expect(getWarningState(UniverseChainId.Mainnet, getPrimaryStablecoin(UniverseChainId.Mainnet).address)).toBe(false)
  })

  it('accepts the primary stablecoin on a non-USDC-keyed chain (Robinhood/USDG)', () => {
    // Regression guard: Robinhood registers USDG, not a `tokens.USDC` key.
    expect(renderHook(() => useToucanAuctionSupportedChains()).result.current).toContain(UniverseChainId.Robinhood)
    expect(getChainInfo(UniverseChainId.Robinhood).tokens.USDC).toBeUndefined()
    expect(getWarningState(UniverseChainId.Robinhood, getPrimaryStablecoin(UniverseChainId.Robinhood).address)).toBe(
      false,
    )
  })

  it('rejects an arbitrary token on a USDC-keyed chain', () => {
    expect(getWarningState(UniverseChainId.Mainnet, ARBITRARY_TOKEN)).toBe(true)
  })

  it('rejects an arbitrary token on a non-USDC-keyed chain (Robinhood)', () => {
    expect(getWarningState(UniverseChainId.Robinhood, ARBITRARY_TOKEN)).toBe(true)
  })

  describe('max bid price ceiling', () => {
    it('leaves the form enabled when no ceiling has been reached', () => {
      const state = renderWarningState({ isMaxBidPriceReached: false })
      expect(state.showMaxBidPriceReachedState).toBe(false)
      expect(state.shouldDisableBidForm).toBe(false)
    })

    it('disables the form once the ceiling is reached mid-auction', () => {
      const state = renderWarningState({ isMaxBidPriceReached: true })
      expect(state.showMaxBidPriceReachedState).toBe(true)
      expect(state.shouldDisableBidForm).toBe(true)
    })

    it('does not raise a warning banner — the ceiling is not an unsupported auction', () => {
      // The warning banner means "we cannot support bidding here". A reached ceiling is
      // normal auction progress and gets its own alert instead.
      expect(renderWarningState({ isMaxBidPriceReached: true }).shouldShowWarningBanner).toBe(false)
    })

    it('yields to the concluded-auction state once the auction has ended', () => {
      const state = renderWarningState({
        auctionProgressState: AuctionProgressState.ENDED,
        isMaxBidPriceReached: true,
      })
      expect(state.showDisabledState).toBe(true)
      expect(state.showMaxBidPriceReachedState).toBe(false)
    })
  })

  describe('unmodeled validation hook', () => {
    it('marks the auction unsupported and disables bidding', () => {
      // Bid acceptance is governed by a hook nobody has inspected, so the user must not
      // be able to commit budget and gas to it.
      const state = renderWarningState({ isUnmodeledValidationHook: true })
      expect(state.shouldShowWarningBanner).toBe(true)
      expect(state.shouldDisableBidForm).toBe(true)
    })

    it('leaves an auction bidable when the hook IS recognized', () => {
      // A modeled hook — KYC, ERC-1155 gate, or a max bid price ceiling — resolves to
      // false here, which is what keeps the Umia ceiling auction biddable.
      const state = renderWarningState({ isUnmodeledValidationHook: false })
      expect(state.shouldShowWarningBanner).toBe(false)
      expect(state.shouldDisableBidForm).toBe(false)
    })
  })
})
