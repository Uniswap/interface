import { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { getSimulationErrorContent } from '~/features/Toucan/Auction/BidForm/BidReviewModal/getSimulationErrorContent'
import {
  BidSimulationError,
  BidSimulationErrorType,
} from '~/features/Toucan/Auction/BidForm/BidReviewModal/useBidSimulation'

// Identity translator so assertions can compare against the raw key.
const t = ((key: string) => key) as TFunction

describe('getSimulationErrorContent', () => {
  it('returns undefined when there is no simulation error', () => {
    expect(getSimulationErrorContent({ simulationError: undefined, isReviewing: true, t })).toBeUndefined()
  })

  it('returns undefined when no longer reviewing, even with an active error', () => {
    const error: BidSimulationError = { type: BidSimulationErrorType.UNKNOWN, message: 'boom' }
    expect(getSimulationErrorContent({ simulationError: error, isReviewing: false, t })).toBeUndefined()
  })

  it('surfaces the below-clearing-price copy with the set-min-bid action', () => {
    const error: BidSimulationError = { type: BidSimulationErrorType.BELOW_CLEARING_PRICE, message: 'below clearing' }

    const content = getSimulationErrorContent({ simulationError: error, isReviewing: true, t })

    expect(content).toEqual({
      title: 'toucan.bidReview.belowClearingTitle',
      description: 'toucan.bidReview.belowClearingDescription',
      showSetMinBidAction: true,
    })
  })

  it('surfaces a distinct message for a network error, with no set-min-bid action', () => {
    const error: BidSimulationError = { type: BidSimulationErrorType.NETWORK_ERROR, message: 'fetch failed' }

    const content = getSimulationErrorContent({ simulationError: error, isReviewing: true, t })

    expect(content).toEqual({
      title: 'toucan.bidReview.networkErrorTitle',
      description: 'toucan.bidReview.networkErrorDescription',
      showSetMinBidAction: false,
    })
  })

  it('surfaces a distinct message for an unknown error, with no set-min-bid action', () => {
    const error: BidSimulationError = { type: BidSimulationErrorType.UNKNOWN, message: 'something odd' }

    const content = getSimulationErrorContent({ simulationError: error, isReviewing: true, t })

    expect(content).toEqual({
      title: 'toucan.bidReview.simulationErrorTitle',
      description: 'toucan.bidReview.simulationErrorDescription',
      showSetMinBidAction: false,
    })
  })

  it('never falls back to the generic unknown-error copy for a classified error', () => {
    const networkError: BidSimulationError = { type: BidSimulationErrorType.NETWORK_ERROR, message: 'timeout' }
    const unknownError: BidSimulationError = { type: BidSimulationErrorType.UNKNOWN, message: 'weird' }

    const networkContent = getSimulationErrorContent({ simulationError: networkError, isReviewing: true, t })
    const unknownContent = getSimulationErrorContent({ simulationError: unknownError, isReviewing: true, t })

    // The bug this guards against: both types silently fell through to the modal's generic
    // "common.unknownError.error" / "toucan.bidReview.confirmationError" fallback.
    expect(networkContent?.title).not.toBe('common.unknownError.error')
    expect(networkContent?.description).not.toBe('toucan.bidReview.confirmationError')
    expect(unknownContent?.title).not.toBe('common.unknownError.error')
    expect(unknownContent?.description).not.toBe('toucan.bidReview.confirmationError')
    // And they read distinctly from each other, not a shared generic message.
    expect(networkContent?.title).not.toBe(unknownContent?.title)
  })
})
