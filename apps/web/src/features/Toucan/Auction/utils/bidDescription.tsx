import { Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import type { BidDescriptionState } from '~/features/Toucan/Auction/utils/bidDetails'

// Module-level constants for description highlighting (no deps, never change)
const HIGHLIGHT_COMPONENT = <Text variant="body4" color="$neutral1" />
const COMPONENTS = { highlight: HIGHLIGHT_COMPONENT }

/**
 * Maps a bid's description state to its modal copy. Pure — every input is already resolved by
 * getBidDisplayInfo, so a new state cannot silently reuse another state's sentence.
 */
// oxlint-disable-next-line typescript/consistent-return -- switch is exhaustive over BidDescriptionState; a `default` would let a new state silently render nothing
export function getBidDescription({
  descriptionState,
  tokenSymbol,
  valuationSummary,
}: {
  descriptionState: BidDescriptionState
  tokenSymbol: string | undefined
  valuationSummary: string
}): ReactNode {
  switch (descriptionState) {
    // The auction's outcome is not known yet, so there is nothing truthful to say about this bid.
    case 'awaitingOutcome':
      return null
    case 'overNotGraduated':
      return <Trans i18nKey="toucan.bidDetails.description.overNotGraduated" components={COMPONENTS} />
    case 'overNotGraduatedExited':
      return <Trans i18nKey="toucan.bidDetails.description.overNotGraduatedExited" components={COMPONENTS} />
    case 'completeInProgress':
      return <Trans i18nKey="toucan.bidDetails.description.completeInProgress" components={COMPONENTS} />
    case 'completePreClaim':
      return <Trans i18nKey="toucan.bidDetails.description.completePreClaim" components={COMPONENTS} />
    case 'completeOver':
      return <Trans i18nKey="toucan.bidDetails.description.completeOver" components={COMPONENTS} />
    case 'completeClaimed':
      return <Trans i18nKey="toucan.bidDetails.description.completeClaimed" components={COMPONENTS} />
    case 'inRangeInProgress':
      return (
        <Trans
          i18nKey="toucan.bidDetails.description.inRangeInProgress"
          values={{ tokenSymbol, valuationSummary }}
          components={COMPONENTS}
        />
      )
    case 'inRangePreClaim':
      return <Trans i18nKey="toucan.bidDetails.description.inRangePreClaim" components={COMPONENTS} />
    case 'inRangeOver':
      return <Trans i18nKey="toucan.bidDetails.description.inRangeOver" components={COMPONENTS} />
    case 'inRangeOutOfRangeClaimed':
      return <Trans i18nKey="toucan.bidDetails.description.inRangeOutOfRangeClaimed" components={COMPONENTS} />
    case 'outOfRangeInProgress':
      return (
        <Trans
          i18nKey="toucan.bidDetails.description.outOfRangeInProgress"
          values={{ valuationSummary }}
          components={COMPONENTS}
        />
      )
    case 'outOfRangePreClaim':
      return <Trans i18nKey="toucan.bidDetails.description.outOfRangePreClaim" components={COMPONENTS} />
    case 'outOfRangePreClaimExited':
      return <Trans i18nKey="toucan.bidDetails.description.outOfRangePreClaimExited" components={COMPONENTS} />
    case 'outOfRangeOver':
      return <Trans i18nKey="toucan.bidDetails.description.outOfRangeOver" components={COMPONENTS} />
    case 'outOfRangeOverExited':
      return <Trans i18nKey="toucan.bidDetails.description.outOfRangeOverExited" components={COMPONENTS} />
  }
}
