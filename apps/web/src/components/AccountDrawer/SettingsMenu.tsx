import { AnalyticsToggle } from 'components/AccountDrawer/AnalyticsToggle'
import { AppVersionRow } from 'components/AccountDrawer/AppVersionRow'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { TestnetsToggle } from 'components/AccountDrawer/TestnetsToggle'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useAccount } from 'hooks/useAccount'
import { deprecatedStyled } from 'lib/styled-components'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import ThemeToggle from 'theme/components/ThemeToggle'
import { Flex, Text } from 'ui/src'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguage, useLanguageInfo } from 'uniswap/src/features/language/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const Container = deprecatedStyled(Column)`
  height: 100%;
`

const StyledChevron = deprecatedStyled(ChevronRight)`
  color: ${({ theme }) => theme.neutral2};
`

const LanguageLabel = deprecatedStyled(Row)`
  white-space: nowrap;
`

const SettingsButton = ({
  title,
  currentState,
  onClick,
  testId,
  showArrow = true,
}: {
  title: ReactNode
  currentState?: ReactNode
  onClick: () => void
  testId?: string
  showArrow?: boolean
}) => (
  <Flex row justifyContent="space-between" py="$padding12" onPress={onClick} testID={testId}>
    <Text variant="body3" color="$neutral1">
      {title}
    </Text>
    <LanguageLabel gap="xs" align="center" width="min-content">
      {currentState && <ThemedText.LabelSmall color="neutral2">{currentState}</ThemedText.LabelSmall>}
      {showArrow && <StyledChevron size={20} />}
    </LanguageLabel>
  </Flex>
)

export default function SettingsMenu({
  onClose,
  openLanguageSettings,
  openLocalCurrencySettings,
  openPasskeySettings,
  openPortfolioBalanceSettings,
}: {
  onClose: () => void
  openLanguageSettings: () => void
  openLocalCurrencySettings: () => void
  openPasskeySettings: () => void
  openPortfolioBalanceSettings: () => void
}) {
  const { t } = useTranslation()
  const activeLanguage = useCurrentLanguage()
  const activeLocalCurrency = useAppFiatCurrency()
  const languageInfo = useLanguageInfo(activeLanguage)
  const connectedWithEmbeddedWallet =
    useAccount().connector?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID

  return (
    <SlideOutMenu title={<Trans i18nKey="common.settings" />} onClose={onClose} versionComponent={<AppVersionRow />}>
      <Container>
        <Flex gap="$gap12">
          <ThemeToggle />

          <SettingsButton
            title={t('settings.setting.currency.title')}
            currentState={activeLocalCurrency}
            onClick={openLocalCurrencySettings}
            testId="local-currency-settings-button"
          />
          <SettingsButton
            title={t('common.language')}
            currentState={languageInfo.displayName}
            onClick={openLanguageSettings}
            testId={TestID.LanguageSettingsButton}
          />
          <SettingsButton
            title={t('settings.setting.balancesActivity.title')}
            onClick={openPortfolioBalanceSettings}
            testId="portfolio-balance-settings-button"
          />
          {connectedWithEmbeddedWallet && <SettingsButton title={t('common.passkeys')} onClick={openPasskeySettings} />}
        </Flex>
        <TestnetsToggle />
        <AnalyticsToggle />
      </Container>
    </SlideOutMenu>
  )
}
