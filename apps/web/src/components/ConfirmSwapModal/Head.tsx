import GetHelpButton from 'components/Button/GetHelp'
import { ConfirmModalState } from 'components/ConfirmSwapModal'
import Row from 'components/Row'
import { Trans } from 'i18n'
import { X } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { FadePresence } from 'theme/components/FadePresence'

const CloseIcon = styled(X)<{ onClick: () => void }>`
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  ${ClickableStyle}
`
export function SwapHead({
  onDismiss,
  isLimitTrade,
  confirmModalState,
}: {
  onDismiss: () => void
  isLimitTrade: boolean
  confirmModalState: ConfirmModalState
}) {
  return (
    <Row width="100%" align="center">
      {confirmModalState === ConfirmModalState.REVIEWING && (
        <Row justify="left">
          <FadePresence>
            <ThemedText.SubHeader>
              {isLimitTrade ? <Trans i18nKey="swap.reviewLimit" /> : <Trans i18nKey="swap.review" />}
            </ThemedText.SubHeader>
          </FadePresence>
        </Row>
      )}
      <Row justify="right" gap="10px">
        <GetHelpButton />
        <CloseIcon onClick={onDismiss} data-testid="confirmation-close-icon" />
      </Row>
    </Row>
  )
}
