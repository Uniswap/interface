import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SettingsItem } from 'src/app/features/settings/components/SettingsItem'
import { SettingsSection } from 'src/app/features/settings/components/SettingsSection'
import { SettingsToggleRow } from 'src/app/features/settings/components/SettingsToggleRow'
import { SettingsItemWithDropdown } from 'src/app/features/settings/SettingsItemWithDropdown'
import ThemeToggle from 'src/app/features/settings/ThemeToggle'
import { AppRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { getIsDefaultProviderFromStorage, setIsDefaultProviderToStorage } from 'src/app/utils/provider'
import { Button, Flex, ScrollView, Text } from 'ui/src'
import {
  ArrowUpRight,
  Chart,
  Coins,
  FileListLock,
  Global,
  HelpCenter,
  Language,
  LineChartDots,
  Lock,
  Passkey,
  Settings,
  Sliders,
  Wrench,
} from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { resetUniswapBehaviorHistory } from 'uniswap/src/features/behaviorHistory/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FiatCurrency, ORDERED_CURRENCIES } from 'uniswap/src/features/fiatCurrency/constants'
import { getFiatCurrencyName, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { PasskeyManagementModal } from 'uniswap/src/features/passkey/PasskeyManagementModal'
import { setCurrentFiatCurrency, setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ConnectionCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { noop } from 'utilities/src/react/noop'
import { CardType, IntroCard, IntroCardGraphicType } from 'wallet/src/components/introCards/IntroCard'
import { SettingsLanguageModal } from 'wallet/src/components/settings/language/SettingsLanguageModal'
import { PermissionsModal } from 'wallet/src/components/settings/permissions/PermissionsModal'
import { PortfolioBalanceModal } from 'wallet/src/components/settings/portfolioBalance/PortfolioBalanceModal'
import { SmartWalletAdvancedSettingsModal } from 'wallet/src/components/smartWallet/modals/SmartWalletAdvancedSettingsModal'
import { authActions } from 'wallet/src/features/auth/saga'
import { AuthActionType } from 'wallet/src/features/auth/types'
import { selectHasViewedConnectionMigration } from 'wallet/src/features/behaviorHistory/selectors'
import { resetWalletBehaviorHistory, setHasViewedConnectionMigration } from 'wallet/src/features/behaviorHistory/slice'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { hasBackup } from 'wallet/src/features/wallet/accounts/utils'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

const manifestVersion = chrome.runtime.getManifest().version

export function SettingsScreen(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { navigateTo, navigateBack } = useExtensionNavigation()
  const currentLanguageInfo = useCurrentLanguageInfo()
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const hasViewedConnectionMigration = useSelector(selectHasViewedConnectionMigration)

  const isSmartWalletEnabled = useFeatureFlag(FeatureFlags.SmartWalletSettings)

  const signerAccount = useSignerAccounts()[0]
  const hasPasskeyBackup = hasBackup(BackupType.Passkey, signerAccount)

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const [isPortfolioBalanceModalOpen, setIsPortfolioBalanceModalOpen] = useState(false)
  const [isTestnetModalOpen, setIsTestnetModalOpen] = useState(false)
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false)
  const [isDefaultProvider, setIsDefaultProvider] = useState(true)

  const onPressLockWallet = async (): Promise<void> => {
    navigateBack()
    await dispatch(authActions.trigger({ type: AuthActionType.Lock }))
  }

  // TODO(WALL-4908): consider wrapping handlers in useCallback
  const { isTestnetModeEnabled } = useEnabledChains()
  const handleTestnetModeToggle = async (isChecked: boolean): Promise<void> => {
    const fireAnalytic = (): void => {
      sendAnalyticsEvent(WalletEventName.TestnetModeToggled, {
        enabled: isChecked,
        location: 'settings',
      })
    }

    // trigger before toggling on (ie disabling analytics)
    if (isChecked) {
      // doesn't fire on time without await and i have no idea why
      await fireAnalytic()
    }

    dispatch(setIsTestnetModeEnabled(isChecked))
    setIsTestnetModalOpen(isChecked)

    // trigger after toggling off (ie enabling analytics)
    if (!isChecked) {
      // updateState()
      fireAnalytic()
    }
  }
  const handleTestnetModalClose = useCallback(() => setIsTestnetModalOpen(false), [])

  const handleAdvancedModalClose = useCallback(() => setIsAdvancedModalOpen(false), [])

  const handleSmartWalletPress = useCallback(() => {
    navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.SmartWallet}`)
    setIsAdvancedModalOpen(false)
  }, [navigateTo])

  useEffect(() => {
    getIsDefaultProviderFromStorage()
      .then((newIsDefaultProvider) => setIsDefaultProvider(newIsDefaultProvider))
      .catch((e) =>
        logger.error(e, {
          tags: { file: 'PermissionsModal', function: 'fetchIsDefaultProvider' },
        }),
      )
  }, [])

  const handleDefaultBrowserToggle = async (isChecked: boolean): Promise<void> => {
    setIsDefaultProvider(!!isChecked)
    await setIsDefaultProviderToStorage(!!isChecked)
  }

  const setConnectionMigrationAsViewed = (): void => {
    dispatch(setHasViewedConnectionMigration(true))
  }

  return (
    <Trace logImpression screen={ExtensionScreens.Settings}>
      {isLanguageModalOpen ? (
        <SettingsLanguageModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />
      ) : undefined}
      {isPortfolioBalanceModalOpen ? (
        <PortfolioBalanceModal
          isOpen={isPortfolioBalanceModalOpen}
          onClose={() => setIsPortfolioBalanceModalOpen(false)}
        />
      ) : undefined}
      {isPermissionsModalOpen ? (
        <PermissionsModal
          isOpen={isPermissionsModalOpen}
          handleDefaultBrowserToggle={handleDefaultBrowserToggle}
          isDefaultBrowserProvider={isDefaultProvider}
          onClose={() => setIsPermissionsModalOpen(false)}
        />
      ) : undefined}
      <TestnetModeModal isOpen={isTestnetModalOpen} onClose={handleTestnetModalClose} />
      <SmartWalletAdvancedSettingsModal
        isTestnetEnabled={isTestnetModeEnabled}
        onTestnetModeToggled={handleTestnetModeToggle}
        isOpen={isAdvancedModalOpen}
        onClose={handleAdvancedModalClose}
        onPressSmartWallet={handleSmartWalletPress}
      />
      {hasPasskeyBackup && (
        <PasskeyManagementModal
          isOpen={isPasskeyModalOpen}
          onClose={() => setIsPasskeyModalOpen(false)}
          address={signerAccount?.address}
        />
      )}
      <Flex fill backgroundColor="$surface1" gap="$spacing8">
        <ScreenHeader title={t('settings.title')} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <SettingsSection title={t('settings.section.preferences')}>
            <>
              {isDevEnv() && (
                <SettingsItem
                  Icon={Settings}
                  title="Developer Settings"
                  onPress={(): void => navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.DevMenu}`)}
                />
              )}
            </>
            <>
              {isDevEnv() && (
                <SettingsItem
                  hideChevron
                  Icon={Settings}
                  title="Clear behavior history"
                  onPress={() => {
                    dispatch(resetWalletBehaviorHistory())
                    dispatch(resetUniswapBehaviorHistory())
                  }}
                />
              )}
            </>
            <ThemeToggle />
            <SettingsItemWithDropdown
              Icon={Coins}
              items={ORDERED_CURRENCIES.map((currency) => {
                return {
                  label: getFiatCurrencyName(t, currency).shortName,
                  value: currency,
                }
              })}
              selected={appFiatCurrencyInfo.code}
              title={t('settings.setting.currency.title')}
              onSelect={(value) => {
                const currency = value as FiatCurrency
                dispatch(setCurrentFiatCurrency(currency))
              }}
            />
            <SettingsItemWithDropdown
              Icon={Language}
              disableDropdown={true}
              items={[]}
              selected={currentLanguageInfo.displayName}
              title={t('settings.setting.language.title')}
              onDisabledDropdownPress={() => {
                setIsLanguageModalOpen(true)
              }}
              onSelect={noop}
            />
            <SettingsItem
              Icon={Chart}
              title={t('settings.setting.smallBalances.title')}
              onPress={(): void => setIsPortfolioBalanceModalOpen(true)}
            />
            {isSmartWalletEnabled ? (
              <SettingsItem
                Icon={Sliders}
                title={t('settings.setting.advanced.title')}
                onPress={(): void => setIsAdvancedModalOpen(true)}
              />
            ) : (
              <SettingsToggleRow
                Icon={Wrench}
                checked={isTestnetModeEnabled}
                title={t('settings.setting.wallet.testnetMode.title')}
                onCheckedChange={handleTestnetModeToggle}
              />
            )}
          </SettingsSection>
          {!hasViewedConnectionMigration && (
            <Flex pt="$padding8">
              <IntroCard
                loggingName={ConnectionCardLoggingName.ConnectionBanner}
                graphic={{ type: IntroCardGraphicType.Icon, Icon: Global }}
                title={t('settings.setting.wallet.connection.banner.title')}
                description={t('settings.setting.wallet.connection.banner.description')}
                cardType={CardType.Dismissible}
                iconColor="$neutral2"
                containerProps={{
                  borderWidth: 0,
                  backgroundColor: '$surface2',
                  shadowColor: '$transparent',
                }}
                onPress={() => {
                  setConnectionMigrationAsViewed()
                }}
                onClose={(): void => {
                  setConnectionMigrationAsViewed()
                }}
              />
            </Flex>
          )}
          <Flex pt="$padding16">
            <SettingsSection title={t('settings.section.privacyAndSecurity')}>
              <SettingsItem
                Icon={Lock}
                title={t('settings.setting.deviceAccess.title')}
                onPress={(): void => navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.DeviceAccess}`)}
              />
              <SettingsItem
                Icon={FileListLock}
                title={t('settings.setting.recoveryPhrase.title')}
                onPress={(): void => navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.ViewRecoveryPhrase}`)}
              />
              <>
                {hasPasskeyBackup && (
                  <SettingsItem
                    Icon={Passkey}
                    title={t('common.passkeys')}
                    onPress={(): void => setIsPasskeyModalOpen(true)}
                  />
                )}
              </>
              <SettingsItem
                Icon={LineChartDots}
                title={t('settings.setting.permissions.title')}
                onPress={(): void => setIsPermissionsModalOpen(true)}
              />
            </SettingsSection>
          </Flex>
          <Flex pt="$padding16">
            <SettingsSection title={t('settings.section.support')}>
              <SettingsItem
                Icon={HelpCenter}
                title={t('settings.setting.helpCenter.title')}
                url={uniswapUrls.helpArticleUrls.extensionHelp}
                RightIcon={ArrowUpRight}
              />
              <Text
                color="$neutral3"
                px="$spacing12"
                py="$spacing4"
                variant="body4"
              >{`Version ${manifestVersion}`}</Text>
            </SettingsSection>
          </Flex>
        </ScrollView>
        <Flex row>
          <Button icon={<Lock />} emphasis="secondary" onPress={onPressLockWallet}>
            {t('settings.action.lock')}
          </Button>
        </Flex>
      </Flex>
    </Trace>
  )
}
