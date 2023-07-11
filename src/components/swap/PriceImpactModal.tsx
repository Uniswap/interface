import { Trans } from '@lingui/macro'
import { formatPriceImpact } from '@uniswap/conedison/format'
import { Percent } from '@thinkincoin-libs/sdk-core'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import { ColumnCenter } from 'components/Column'
import Row from 'components/Row'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'

import Modal from '../Modal'

const Wrapper = styled(ColumnCenter)`
  padding: 16px 24px;
`

const IconContainer = styled.div`
  padding: 32px 0px;
`

const WarningIcon = styled(AlertTriangle)`
  color: ${({ theme }) => theme.accentCritical};
`

const ButtonContainer = styled(ColumnCenter)`
  padding: 12px 0px 0px;
`

const StyledThemeButton = styled(ThemeButton)`
  width: 100%;
`

interface PriceImpactModalProps {
  priceImpact: Percent
  onDismiss: () => void
  onContinue: () => void
}

export default function PriceImpactModal({ priceImpact, onDismiss, onContinue }: PriceImpactModalProps) {
  return (
    <Modal isOpen onDismiss={onDismiss}>
      <Wrapper gap="md">
        <Row padding="8px 0px 4px">
          <CloseIcon size={24} onClick={onDismiss} />
        </Row>
        <IconContainer>
          <WarningIcon size={48} />
        </IconContainer>
        <ColumnCenter gap="sm">
          <ThemedText.HeadlineSmall fontWeight={500}>
            <Trans>Warning</Trans>
          </ThemedText.HeadlineSmall>
          <ThemedText.BodyPrimary lineHeight="24px" textAlign="center">
            <Trans>
              This transaction will result in a{' '}
              <ThemedText.BodyPrimary lineHeight="24px" color="accentFailure" display="inline">
                {formatPriceImpact(priceImpact)}
              </ThemedText.BodyPrimary>{' '}
              price impact on the market price of this pool. Do you wish to continue?
            </Trans>
          </ThemedText.BodyPrimary>
        </ColumnCenter>
        <ButtonContainer gap="md">
          <StyledThemeButton size={ButtonSize.large} emphasis={ButtonEmphasis.failure} onClick={onContinue}>
            <Trans>Continue</Trans>
          </StyledThemeButton>
          <StyledThemeButton size={ButtonSize.medium} emphasis={ButtonEmphasis.low} onClick={onDismiss}>
            <Trans>Cancel</Trans>
          </StyledThemeButton>
        </ButtonContainer>
      </Wrapper>
    </Modal>
  )
}
