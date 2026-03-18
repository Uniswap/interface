import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguage, useLanguageInfo } from 'uniswap/src/features/language/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { AnalyticsToggle } from '~/components/AccountDrawer/AnalyticsToggle'
import { AppVersionRow } from '~/components/AccountDrawer/AppVersionRow'
import { SettingsButton } from '~/components/AccountDrawer/SettingsButton'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'
import { useAccount } from '~/hooks/useAccount'
import { ThemeToggleWithLabel } from '~/theme/components/ThemeToggle'

export default function SettingsMenu({
  onClose,
  openLanguageSettings,
  openLocalCurrencySettings,
  openPasskeySettings,
  openPortfolioBalanceSettings,
  openAdvancedSettings,
}: {
  onClose: () => void
  openLanguageSettings: () => void
  openLocalCurrencySettings: () => void
  openPasskeySettings: () => void
  openPortfolioBalanceSettings: () => void
  openAdvancedSettings: () => void
}) {
  const { t } = useTranslation()
  const activeLanguage = useCurrentLanguage()
  const activeLocalCurrency = useAppFiatCurrency()
  const languageInfo = useLanguageInfo(activeLanguage)
  const connectedWithEmbeddedWallet =
    useAccount().connector?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID

  return (
    <SlideOutMenu title={t('common.settings')} onClose={onClose} versionComponent={<AppVersionRow />}>
      <Flex height="100%">
        <Flex gap="$gap12">
          <ThemeToggleWithLabel />

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
          <SettingsButton
            title={t('settings.setting.advanced.title')}
            onClick={openAdvancedSettings}
            testId={TestID.AdvancedSettingsButton}
          />
        </Flex>

        <AnalyticsToggle />
      </Flex>
    </SlideOutMenu>
  )
}
