import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { LOCALE_LABEL } from 'constants/locales'
import { useCurrencyConversionFlagEnabled } from 'featureFlags/flags/currencyConversion'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import ThemeToggle from 'theme/components/ThemeToggle'

import { AnalyticsToggle } from './AnalyticsToggle'
import { GitVersionRow } from './GitVersionRow'
import { LanguageMenuItems } from './LanguageMenu'
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
  openLanguageSettings,
  openLocalCurrencySettings,
}: {
  onClose: () => void
  openLanguageSettings: () => void
  openLocalCurrencySettings: () => void
}) {
  const currencyConversionEnabled = useCurrencyConversionFlagEnabled()
  const activeLocale = useActiveLocale()
  const activeLocalCurrency = useActiveLocalCurrency()

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
            <AnalyticsToggle />
            <TestnetsToggle />
          </ToggleWrapper>
          {!currencyConversionEnabled && (
            <>
              <SectionTitle data-testid="wallet-header">
                <Trans>Language</Trans>
              </SectionTitle>
              <LanguageMenuItems />
            </>
          )}

          {currencyConversionEnabled && (
            <Column>
              <SettingsButton
                title={<Trans>Language</Trans>}
                currentState={LOCALE_LABEL[activeLocale]}
                onClick={openLanguageSettings}
                testId="language-settings-button"
              />
              <SettingsButton
                title={<Trans>Currency</Trans>}
                currentState={activeLocalCurrency}
                onClick={openLocalCurrencySettings}
                testId="local-currency-settings-button"
              />
            </Column>
          )}
        </div>
        <GitVersionRow />
      </Container>
    </SlideOutMenu>
  )
}
