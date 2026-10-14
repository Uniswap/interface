import { TFunction } from 'i18next'
import {
  BidSimulationError,
  BidSimulationErrorType,
} from '~/features/Toucan/Auction/BidForm/BidReviewModal/useBidSimulation'

export interface SimulationErrorContent {
  title: string
  description: string
  /** Only the below-clearing-price case offers a "set minimum bid" recovery action. */
  showSetMinBidAction: boolean
}

interface GetSimulationErrorContentParams {
  simulationError: BidSimulationError | undefined
  isReviewing: boolean
  t: TFunction
}

/**
 * Maps a classified bid-simulation failure to the copy shown in the review modal's error
 * banner. Only rendered while reviewing — once the flow moves past review the banner belongs
 * to a different state.
 */
export function getSimulationErrorContent({
  simulationError,
  isReviewing,
  t,
}: GetSimulationErrorContentParams): SimulationErrorContent | undefined {
  if (!simulationError || !isReviewing) {
    return undefined
  }

  switch (simulationError.type) {
    case BidSimulationErrorType.BELOW_CLEARING_PRICE:
      return {
        title: t('toucan.bidReview.belowClearingTitle'),
        description: t('toucan.bidReview.belowClearingDescription'),
        showSetMinBidAction: true,
      }
    case BidSimulationErrorType.NETWORK_ERROR:
      return {
        title: t('toucan.bidReview.networkErrorTitle'),
        description: t('toucan.bidReview.networkErrorDescription'),
        showSetMinBidAction: false,
      }
    case BidSimulationErrorType.UNKNOWN:
      return {
        title: t('toucan.bidReview.simulationErrorTitle'),
        description: t('toucan.bidReview.simulationErrorDescription'),
        showSetMinBidAction: false,
      }
    default:
      return undefined
  }
}
