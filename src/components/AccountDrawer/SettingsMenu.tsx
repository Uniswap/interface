import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { useCurrencyConversionFlagEnabled } from 'featureFlags/flags/currencyConversion'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import ThemeToggle from 'theme/components/ThemeToggle'

import { GitVersionRow } from './GitVersionRow'
import { SlideOutMenu } from './SlideOutMenu'
import { SmallBalanceToggle } from './SmallBalanceToggle'
import { TestnetsToggle } from './TestnetsToggle'

const Container = styled(Column)`
  height: 100%;
  justify-content: space-between;
`

const SectionTitle = styled(ThemedText.SubHeader)`
  color: ${({ theme }) => theme.neutral2};
  padding-bottom: 24px;
`

const ToggleWrapper = styled.div<{ currencyConversionEnabled?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: ${({ currencyConversionEnabled }) => (currencyConversionEnabled ? '10px' : '24px')};
`

const SettingsButtonWrapper = styled(Row)`
  ${ClickableStyle}
  padding: 16px 0px;
`

const StyledChevron = styled(ChevronRight)`
  color: ${({ theme }) => theme.neutral2};
`

const LanguageLabel = styled(Row)`
  white-space: nowrap;
`

const SettingsButton = ({
  title,
  currentState,
  onClick,
  testId,
}: {
  title: ReactNode
  currentState: ReactNode
  onClick: () => void
  testId?: string
}) => (
  <SettingsButtonWrapper data-testid={testId} align="center" justify="space-between" onClick={onClick}>
    <ThemedText.SubHeaderSmall color="textPrimary">{title}</ThemedText.SubHeaderSmall>
    <LanguageLabel gap="xs" align="center" width="min-content">
      <ThemedText.LabelSmall color="textPrimary">{currentState}</ThemedText.LabelSmall>
      <StyledChevron size={20} />
    </LanguageLabel>
  </SettingsButtonWrapper>
)

export default function SettingsMenu({
  onClose,
}: {
  onClose: () => void
  openLanguageSettings: () => void
  openLocalCurrencySettings: () => void
}) {
  const currencyConversionEnabled = useCurrencyConversionFlagEnabled()

  return (
    <SlideOutMenu title={<Trans>Settings</Trans>} onClose={onClose}>
      <Container>
        <div>
          <SectionTitle data-testid="wallet-header">
            <Trans>Preferences</Trans>
          </SectionTitle>
          <ToggleWrapper currencyConversionEnabled={currencyConversionEnabled}>
            <ThemeToggle />
            <SmallBalanceToggle />
            <TestnetsToggle />
          </ToggleWrapper>
        </div>
        <GitVersionRow />
      </Container>
    </SlideOutMenu>
  )
}
