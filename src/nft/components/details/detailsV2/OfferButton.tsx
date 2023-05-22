import { Trans } from '@lingui/macro'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import { HandHoldingDollarIcon } from 'nft/components/icons'
import styled from 'styled-components/macro'

import { ButtonStyles } from './shared'

const MakeOfferButtonSmall = styled(ButtonPrimary)`
  padding: 16px;
  ${ButtonStyles}
`

const MakeOfferButtonLarge = styled(ButtonGray)`
  white-space: nowrap;
  ${ButtonStyles}
`

export const OfferButton = ({ smallVersion }: { smallVersion?: boolean }) => {
  if (smallVersion) {
    return (
      <MakeOfferButtonSmall>
        <HandHoldingDollarIcon />
      </MakeOfferButtonSmall>
    )
  }

  return (
    <MakeOfferButtonLarge>
      <Trans>Make an offer</Trans>
    </MakeOfferButtonLarge>
  )
}
