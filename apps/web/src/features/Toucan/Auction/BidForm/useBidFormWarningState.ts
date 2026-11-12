import { type UniverseChainId, AddressStringFormat, areAddressesEqual, normalizeAddress } from '@universe/chains'
import { useMemo } from 'react'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { zeroAddress } from '~/chains'
import { AuctionProgressState, type UserBid } from '~/features/Toucan/Auction/store/types'
import { useToucanAuctionSupportedChains } from '~/features/Toucan/supportedChains'
import { getSupportedAuctionCurrencyAddresses } from '~/features/Toucan/utils/raiseCurrency'

interface UseBidFormWarningStateParams {
  chainId?: UniverseChainId
  currency?: string
  auctionProgressState: AuctionProgressState
  userBids: UserBid[]
  validationError?: boolean
  /**
   * A non-zero validation hook that the backend recognized NOTHING about — an empty
   * validations array. Its bid acceptance is governed by code we have never inspected, so
   * the auction is treated as unsupported, while hooks we do model (KYC, ERC-1155 gate, a
   * max bid price ceiling) stay bidable.
   *
   * Keyed on the lookup RESULT, not on the mere presence of a hook. Does not cover a
   * composed hook whose modeled leg yields a validation — see the call site in BidForm.
   */
  isUnmodeledValidationHook?: boolean
  /**
   * True when a maxBidPrice() validation hook's ceiling has been reached, leaving no
   * valid bid price. The auction is still running but cannot take new bids.
   */
  isMaxBidPriceReached?: boolean
}

interface BidFormWarningState {
  showDisabledState: boolean
  shouldShowWarningBanner: boolean
  shouldDisableBidForm: boolean
  /** Render the ceiling-reached alert instead of the concluded-auction one. */
  showMaxBidPriceReachedState: boolean
}

export function useBidFormWarningState({
  chainId,
  currency,
  auctionProgressState,
  userBids,
  validationError,
  isMaxBidPriceReached,
  isUnmodeledValidationHook,
}: UseBidFormWarningStateParams): BidFormWarningState {
  const auctionSupportedChains = useToucanAuctionSupportedChains()

  return useMemo(() => {
    const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED
    const hasNoBids = userBids.length === 0
    const showDisabledState = isAuctionEnded && hasNoBids

    const isSupportedChain = Boolean(chainId && auctionSupportedChains.includes(chainId))
    const normalizedCurrency = currency ? normalizeAddress(currency, AddressStringFormat.Lowercase) : undefined
    const isNativeBidToken = Boolean(
      chainId &&
      normalizedCurrency &&
      (normalizedCurrency === zeroAddress || isNativeCurrencyAddress(chainId, normalizedCurrency)),
    )
    // Accept exactly the currencies the create flow accepts, from the shared source of truth.
    const isSupportedBidToken =
      isNativeBidToken ||
      Boolean(
        chainId &&
        isSupportedChain &&
        normalizedCurrency &&
        getSupportedAuctionCurrencyAddresses(chainId).some((supportedAddress) =>
          areAddressesEqual({
            addressInput1: { address: normalizedCurrency, chainId },
            addressInput2: { address: supportedAddress, chainId },
          }),
        ),
      )
    // Unsupported means either the validation lookup FAILED, or it succeeded and
    // recognized nothing about a hook that is actually present. The mere presence of a
    // hook is not enough — hooks we understand (KYC, ERC-1155 gate, a max bid price
    // ceiling) are all bidable.
    const isValidationErrorWarning = Boolean(validationError) || Boolean(isUnmodeledValidationHook)
    const isUnsupportedChainWarning = Boolean(chainId && !isSupportedChain)
    const isUnsupportedBidTokenWarning = Boolean(isSupportedChain && normalizedCurrency && !isSupportedBidToken)
    const shouldShowWarningBanner =
      isUnsupportedChainWarning || isUnsupportedBidTokenWarning || isValidationErrorWarning
    // A reached ceiling closes an otherwise-running auction to new bids, so it disables
    // the form exactly like a concluded one. Suppressed once the auction has actually
    // ended, so the concluded copy wins rather than stacking two alerts.
    const showMaxBidPriceReachedState = Boolean(isMaxBidPriceReached) && !isAuctionEnded
    const shouldDisableBidForm = showDisabledState || shouldShowWarningBanner || showMaxBidPriceReachedState

    return {
      showDisabledState,
      shouldShowWarningBanner,
      shouldDisableBidForm,
      showMaxBidPriceReachedState,
    }
  }, [
    auctionProgressState,
    auctionSupportedChains,
    chainId,
    currency,
    userBids,
    validationError,
    isMaxBidPriceReached,
    isUnmodeledValidationHook,
  ])
}
