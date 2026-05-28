import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { ChartBar } from 'ui/src/components/icons/ChartBar'
import { Coins } from 'ui/src/components/icons/Coins'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { FileListLock } from 'ui/src/components/icons/FileListLock'
import { Gas } from 'ui/src/components/icons/Gas'
import { Language } from 'ui/src/components/icons/Language'
import { Power } from 'ui/src/components/icons/Power'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useEnableCustomGasFeeEntry } from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import { useCurrentLanguage, useLanguageInfo } from 'uniswap/src/features/language/hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { AnalyticsToggle } from '~/components/AccountDrawer/AnalyticsToggle'
import { useOnDisconnect } from '~/components/AccountDrawer/DisconnectButton'
import { SettingsButton } from '~/components/AccountDrawer/SettingsButton'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'
import { TestnetsToggle } from '~/components/AccountDrawer/TestnetsToggle'
import { useIsEmbeddedWallet } from '~/hooks/useIsEmbeddedWallet'
import { ThemeToggleWithLabel } from '~/theme/components/ThemeToggle'

function SectionHeader({ title }: { title: string }) {
  return (
    <Text variant="subheading2" color="$neutral2">
      {title}
    </Text>
  )
}

export function SettingsMenu({
  onClose,
  openLanguageSettings,
  openLocalCurrencySettings,
  openPasskeySettings,
  openRecoveryPhraseSettings,
  openPortfolioBalanceSettings,
  openStorageSettings,
  openNetworkCostSettings,
}: {
  onClose: () => void
  openLanguageSettings: () => void
  openLocalCurrencySettings: () => void
  openPasskeySettings: () => void
  openRecoveryPhraseSettings: () => void
  openPortfolioBalanceSettings: () => void
  openStorageSettings: () => void
  openNetworkCostSettings: () => void
}) {
  const { t } = useTranslation()
  const activeLanguage = useCurrentLanguage()
  const activeLocalCurrency = useAppFiatCurrency()
  const languageInfo = useLanguageInfo(activeLanguage)
  const connectedWithEmbeddedWallet = useIsEmbeddedWallet()
  const onLogOut = useOnDisconnect()
  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()

  return (
    <SlideOutMenu title={t('common.settings')} onClose={onClose}>
      <Flex gap="$gap24" px="$padding12">
        <Flex gap="$gap8">
          <SectionHeader title={t('settings.section.preferences')} />
          <ThemeToggleWithLabel />
          <SettingsButton
            icon={<Coins size="$icon.24" color="$neutral2" />}
            title={t('settings.setting.currency.title')}
            currentState={activeLocalCurrency}
            onClick={openLocalCurrencySettings}
            testId="local-currency-settings-button"
          />
          <SettingsButton
            icon={<Language size="$icon.24" color="$neutral2" />}
            title={t('common.language')}
            currentState={languageInfo.displayName}
            onClick={openLanguageSettings}
            testId={TestID.LanguageSettingsButton}
          />
          <SettingsButton
            icon={
              <Flex centered width="$icon.24" height="$icon.24">
                <ChartBar size="$icon.18" color="$neutral2" />
              </Flex>
            }
            title={t('settings.setting.balancesActivity.title')}
            onClick={openPortfolioBalanceSettings}
            testId="portfolio-balance-settings-button"
          />
        </Flex>

        <Flex gap="$gap8">
          <SectionHeader title={t('settings.section.privacyAndSecurity')} />
          {connectedWithEmbeddedWallet && (
            <SettingsButton
              icon={<ShieldCheck size="$icon.24" color="$neutral2" />}
              title={t('settings.setting.loginMethods')}
              onClick={openPasskeySettings}
              testId={TestID.PasskeySettings}
            />
          )}
          {connectedWithEmbeddedWallet && (
            <SettingsButton
              icon={<FileListLock size="$icon.24" color="$neutral2" />}
              title={t('settings.setting.recoveryPhrase.title')}
              onClick={openRecoveryPhraseSettings}
              testId={TestID.WalletSettingsRecoveryPhrase}
            />
          )}
          <AnalyticsToggle />
        </Flex>

        <Flex gap="$gap8">
          <SectionHeader title={t('common.advanced')} />
          {isGasFeeOverridesEnabled && connectedWithEmbeddedWallet && (
            <SettingsButton
              icon={<Gas size="$icon.24" color="$neutral2" />}
              title={t('settings.networkCosts.title')}
              currentState={enableCustomGasFeeEntry ? t('gas.override.mode.custom') : t('gas.override.mode.auto')}
              onClick={openNetworkCostSettings}
              testId={TestID.WalletSettingsNetworkCosts}
            />
          )}
          <SettingsButton
            icon={<DocumentList size="$icon.24" color="$neutral2" />}
            title={t('settings.setting.storage.title')}
            onClick={openStorageSettings}
          />
          <TestnetsToggle />
        </Flex>

        {connectedWithEmbeddedWallet && (
          <Trace logPress element={ElementName.SignOut}>
            <Flex row alignSelf="stretch" mb="$padding8">
              <Button
                size="medium"
                emphasis="secondary"
                icon={<Power size="$icon.20" color="$neutral2" />}
                onPress={onLogOut}
              >
                {t('settings.logOut')}
              </Button>
            </Flex>
          </Trace>
        )}
      </Flex>
    </SlideOutMenu>
  )
}
