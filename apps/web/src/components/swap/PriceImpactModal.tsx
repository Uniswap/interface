import { Percent } from '@uniswap/sdk-core'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import { ColumnCenter } from 'components/Column'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { AlertTriangle } from 'react-feather'
import { CloseIcon, ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'

const Wrapper = styled(ColumnCenter)`
  padding: 16px 24px;
`

const IconContainer = styled.div`
  padding: 32px 0px;
`

const WarningIcon = styled(AlertTriangle)`
  color: ${({ theme }) => theme.critical};
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
  const { formatPercent } = useFormatter()
  const impact = `~${formatPercent(priceImpact)}`

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
          <ThemedText.HeadlineSmall fontWeight={535}>
            <Trans i18nKey="common.warning" />
          </ThemedText.HeadlineSmall>
          <ThemedText.BodyPrimary lineHeight="24px" textAlign="center">
            <Trans
              i18nKey="swap.warning.priceImpact"
              components={{
                impact: (
                  <ThemedText.BodyPrimary lineHeight="24px" color="critical" display="inline">
                    {impact}
                  </ThemedText.BodyPrimary>
                ),
              }}
            />
          </ThemedText.BodyPrimary>
        </ColumnCenter>
        <ButtonContainer gap="md">
          <StyledThemeButton size={ButtonSize.large} emphasis={ButtonEmphasis.failure} onClick={onContinue}>
            <Trans i18nKey="common.continue.button" />
          </StyledThemeButton>
          <StyledThemeButton size={ButtonSize.medium} emphasis={ButtonEmphasis.low} onClick={onDismiss}>
            <Trans i18nKey="common.cancel.button" />
          </StyledThemeButton>
        </ButtonContainer>
      </Wrapper>
    </Modal>
  )
}
