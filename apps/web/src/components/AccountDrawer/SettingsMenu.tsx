import { AnalyticsToggle } from 'components/AccountDrawer/AnalyticsToggle'
import { GitVersionRow } from 'components/AccountDrawer/GitVersionRow'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { SmallBalanceToggle } from 'components/AccountDrawer/SmallBalanceToggle'
import { SpamToggle } from 'components/AccountDrawer/SpamToggle'
import { TestnetsToggle } from 'components/AccountDrawer/TestnetsToggle'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans } from 'react-i18next'
import { ClickableStyle, ThemedText } from 'theme/components'
import ThemeToggle from 'theme/components/ThemeToggle'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguage, useLanguageInfo } from 'uniswap/src/features/language/hooks'

const Container = styled(Column)`
  height: 100%;
  justify-content: space-between;
`

const ToggleWrapper = styled.div<{ currencyConversionEnabled?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: '10px';
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
  const activeLanguage = useCurrentLanguage()
  const activeLocalCurrency = useAppFiatCurrency()
  const languageInfo = useLanguageInfo(activeLanguage)

  return (
    <SlideOutMenu title={<Trans i18nKey="common.settings" />} onClose={onClose}>
      <Container>
        <div>
          <ToggleWrapper>
            <ThemeToggle />
            <SmallBalanceToggle />
            <SpamToggle />
            <AnalyticsToggle />
            <TestnetsToggle />
          </ToggleWrapper>

          <Column>
            <SettingsButton
              title={<Trans i18nKey="common.language" />}
              currentState={languageInfo.displayName}
              onClick={openLanguageSettings}
              testId="language-settings-button"
            />
            <SettingsButton
              title={<Trans i18nKey="common.currency" />}
              currentState={activeLocalCurrency}
              onClick={openLocalCurrencySettings}
              testId="local-currency-settings-button"
            />
          </Column>
        </div>
        <GitVersionRow />
      </Container>
    </SlideOutMenu>
  )
}
