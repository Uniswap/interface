import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { X } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { FadePresence } from 'theme/components/FadePresence'

import GetHelpButton from '../Button/GetHelp'

const CloseIcon = styled(X)<{ onClick: () => void }>`
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  ${ClickableStyle}
`
export function SwapHead({ onDismiss, isLimitTrade }: { onDismiss: () => void; isLimitTrade: boolean }) {
  return (
    <Row width="100%" align="center">
      <Row justify="left">
        <FadePresence>
          <ThemedText.SubHeader>
            {isLimitTrade ? <Trans>Review limit</Trans> : <Trans>Review swap</Trans>}
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
