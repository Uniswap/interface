import { AnalyticsToggle } from 'components/AccountDrawer/AnalyticsToggle'
import { GitVersionRow } from 'components/AccountDrawer/GitVersionRow'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { SmallBalanceToggle } from 'components/AccountDrawer/SmallBalanceToggle'
import { SpamToggle } from 'components/AccountDrawer/SpamToggle'
import { TestnetsToggle } from 'components/AccountDrawer/TestnetsToggle'
import Column from 'components/Column'
import Row from 'components/Row'
import { LOCALE_LABEL } from 'constants/locales'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import { ClickableStyle, ThemedText } from 'theme/components'
import ThemeToggle from 'theme/components/ThemeToggle'
import { Trans } from 'uniswap/src/i18n'

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
  const activeLocale = useActiveLocale()
  const activeLocalCurrency = useActiveLocalCurrency()

  // we do not collect analytics atm
  const shouldAllowAnalytics = false

  return (
    <SlideOutMenu title={<Trans i18nKey="common.settings" />} onClose={onClose}>
      <Container>
        <div>
          <ToggleWrapper>
            <ThemeToggle />
            <SmallBalanceToggle />
            <SpamToggle />
            {shouldAllowAnalytics && <AnalyticsToggle />}
            <TestnetsToggle />
          </ToggleWrapper>

          <Column>
            <SettingsButton
              title={<Trans i18nKey="common.language" />}
              currentState={LOCALE_LABEL[activeLocale]}
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
