import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { FadePresence } from 'components/swap/PendingModalContent/Logos'
import { X } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'

import GetHelpButton from '../Button/GetHelp'

const CloseIcon = styled(X)<{ onClick: () => void }>`
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  ${ClickableStyle}
`
export default function Head({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Row width="100%" align="center">
      <Row justify="left">
        <FadePresence>
          <ThemedText.SubHeader>
            <Trans>Review swap</Trans>
          </ThemedText.SubHeader>
        </FadePresence>
      </Row>
      <Row justify="right" gap="10px">
        <GetHelpButton />
        <CloseIcon onClick={onDismiss} data-testid="confirmation-close-icon" />
      </Row>
    </Row>
  )
}
