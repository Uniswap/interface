import { useNavigation } from '@react-navigation/core'
import { default as React, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'
import { OnboardingStackNavigationProp, SettingsStackNavigationProp } from 'src/app/navigation/types'
import { FooterSettings } from 'src/components/Settings/FooterSettings'
import { OnboardingRow } from 'src/components/Settings/OnboardingRow'
import { ResetBehaviorHistoryRow } from 'src/components/Settings/ResetBehaviorHistoryRow'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { WalletSettings } from 'src/components/Settings/WalletSettings'
import { SettingsList } from 'src/components/Settings/lists/SettingsList'
import { SectionData } from 'src/components/Settings/lists/types'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { useBiometricsState } from 'src/features/biometrics/useBiometricsState'
import { useDeviceSupportsBiometricAuth } from 'src/features/biometrics/useDeviceSupportsBiometricAuth'
import { useBiometricName } from 'src/features/biometricsSettings/hooks'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks/useNotificationOSPermissionsEnabled'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { useHapticFeedback } from 'src/utils/haptics/useHapticFeedback'
import { Flex, IconProps, Text, useSporeColors } from 'ui/src'
import BookOpenIcon from 'ui/src/assets/icons/book-open.svg'
import ContrastIcon from 'ui/src/assets/icons/contrast.svg'
import FaceIdIcon from 'ui/src/assets/icons/faceid.svg'
import FingerprintIcon from 'ui/src/assets/icons/fingerprint.svg'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import MessageQuestion from 'ui/src/assets/icons/message-question.svg'
import UniswapIcon from 'ui/src/assets/icons/uniswap-logo.svg'
import {
  Bell,
  Chart,
  Cloud,
  Coins,
  FileListLock,
  Language,
  LikeSquare,
  LineChartDots,
  TouchId,
  WavePulse,
  Wrench,
} from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { isDevEnv } from 'utilities/src/environment/env'
import { isAndroid } from 'utilities/src/platform'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

// avoids rendering during animation which makes it laggy
// set to a bit above the Switch animation "simple" which is 80ms
const AVOID_RENDER_DURING_ANIMATION_MS = 100

export function SettingsScreen(): JSX.Element {
  const navigation = useNavigation<SettingsStackNavigationProp & OnboardingStackNavigationProp>()
  const dispatch = useDispatch()
  const colors = useSporeColors()
  const { deviceSupportsBiometrics } = useBiometricsState()
  const { t } = useTranslation()

  // check if device supports biometric authentication, if not, hide option
  const { touchId: isTouchIdSupported, faceId: isFaceIdSupported } = useDeviceSupportsBiometricAuth()

  const biometricsMethod = useBiometricName(isTouchIdSupported)
  const currentAppearanceSetting = useCurrentAppearanceSetting()
  const currentFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const { originName: currentLanguage } = useCurrentLanguageInfo()

  const { hapticsEnabled, setHapticsEnabled } = useHapticFeedback()

  const onToggleEnableHaptics = useCallback(() => {
    setTimeout(() => {
      setHapticsEnabled(!hapticsEnabled)
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [setHapticsEnabled, hapticsEnabled])

  const [isTestnetModalOpen, setIsTestnetModalOpen] = useState(false)
  const { notificationPermissionsEnabled: notificationOSPermission } = useNotificationOSPermissionsEnabled()

  const { isTestnetModeEnabled } = useEnabledChains()
  const handleTestnetModeToggle = useCallback((): void => {
    const newIsTestnetMode = !isTestnetModeEnabled

    const fireAnalytic = (): void =>
      sendAnalyticsEvent(WalletEventName.TestnetModeToggled, {
        enabled: newIsTestnetMode,
        location: 'settings',
      })

    setTimeout(() => {
      // trigger before toggling on (ie disabling analytics)
      if (newIsTestnetMode) {
        fireAnalytic()
      }

      setIsTestnetModalOpen(newIsTestnetMode)
      dispatch(setIsTestnetModeEnabled(newIsTestnetMode))

      // trigger after toggling off (ie enabling analytics)
      if (!newIsTestnetMode) {
        fireAnalytic()
      }
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [dispatch, isTestnetModeEnabled])

  // Signer account info
  const signerAccount = useSignerAccounts()[0]
  // We sync backup state across all accounts under the same mnemonic, so can check status with any account.
  const hasCloudBackup = signerAccount?.backups?.includes(BackupType.Cloud)
  const noSignerAccountImported = !signerAccount
  const { walletNeedsRestore } = useWalletRestore()

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SettingsSectionItem | SettingsSectionItemComponent>): JSX.Element | null => {
      if (item.isHidden) {
        return null
      }
      if ('component' in item) {
        return item.component
      }
      return (
        <SettingsRow key={item.screen} navigation={navigation} page={item} checkIfCanProceed={item.checkIfCanProceed} />
      )
    },
    [navigation],
  )

  const sections: SettingsSection[] = useMemo((): SettingsSection[] => {
    const svgProps: SvgProps = {
      color: colors.neutral2.get(),
      height: iconSizes.icon24,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      width: iconSizes.icon24,
    }
    const iconProps: IconProps = {
      color: '$neutral2',
      size: '$icon.24',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }

    // Defining them inline instead of outside component b.c. they need t()
    return [
      {
        subTitle: t('settings.section.preferences'),
        data: [
          {
            modal: ModalName.SettingsAppearance,
            text: t('settings.setting.appearance.title'),
            currentSetting:
              currentAppearanceSetting === 'system'
                ? t('settings.setting.appearance.option.device.title')
                : currentAppearanceSetting === 'dark'
                  ? t('settings.setting.appearance.option.dark.title')
                  : t('settings.setting.appearance.option.light.title'),
            icon: <ContrastIcon {...svgProps} />,
          },
          {
            modal: ModalName.FiatCurrencySelector,
            text: t('settings.setting.currency.title'),
            currentSetting: currentFiatCurrencyInfo.code,
            icon: <Coins {...iconProps} />,
          },
          {
            modal: ModalName.LanguageSelector,
            text: t('settings.setting.language.title'),
            currentSetting: currentLanguage,
            icon: <Language {...iconProps} />,
          },
          {
            screen: MobileScreens.SettingsNotifications,
            text: t('settings.setting.notifications.title'),
            icon: <Bell {...iconProps} />,
            checkIfCanProceed: (): boolean => {
              if (notificationOSPermission === NotificationPermission.Enabled) {
                return true
              }
              navigation.navigate(ModalName.NotificationsOSSettings)
              return false
            },
          },
          {
            modal: ModalName.PortfolioBalanceModal,
            text: t('settings.setting.smallBalances.title'),
            icon: <Chart {...iconProps} />,
          },
          {
            text: t('settings.setting.hapticTouch.title'),
            icon: <WavePulse {...iconProps} />,
            isToggleEnabled: hapticsEnabled,
            onToggle: onToggleEnableHaptics,
          },
          {
            text: t('settings.setting.wallet.testnetMode.title'),
            icon: <Wrench {...iconProps} />,
            isToggleEnabled: isTestnetModeEnabled,
            onToggle: handleTestnetModeToggle,
          },
        ],
      },
      {
        subTitle: t('settings.section.privacyAndSecurity'),
        isHidden: noSignerAccountImported,
        data: [
          ...(deviceSupportsBiometrics
            ? [
                {
                  modal: ModalName.BiometricsModal,
                  isHidden: !isTouchIdSupported && !isFaceIdSupported,
                  text: isAndroid ? t('settings.setting.biometrics.title') : biometricsMethod,
                  icon: isAndroid ? (
                    <TouchId size="$icon.20" />
                  ) : isTouchIdSupported ? (
                    <FingerprintIcon {...svgProps} />
                  ) : (
                    <FaceIdIcon {...svgProps} />
                  ),
                },
              ]
            : []),
          {
            screen: MobileScreens.SettingsViewSeedPhrase,
            text: t('settings.setting.recoveryPhrase.title'),
            icon: <FileListLock {...iconProps} />,
            screenProps: { address: signerAccount?.address ?? '', walletNeedsRestore },
            isHidden: noSignerAccountImported,
          },
          {
            screen: walletNeedsRestore
              ? MobileScreens.OnboardingStack
              : hasCloudBackup
                ? MobileScreens.SettingsCloudBackupStatus
                : MobileScreens.SettingsCloudBackupPasswordCreate,
            screenProps: walletNeedsRestore
              ? {
                  screen: OnboardingScreens.RestoreCloudBackupLoading,
                  params: {
                    entryPoint: OnboardingEntryPoint.Sidebar,
                    importType: ImportType.Restore,
                  },
                }
              : { address: signerAccount?.address ?? '' },
            text: t('settings.setting.backup.selected', {
              cloudProviderName: getCloudProviderName(),
            }),
            icon: <Cloud color="$neutral2" size="$icon.24" />,
            isHidden: noSignerAccountImported,
          },
          {
            modal: ModalName.PermissionsModal,
            text: t('settings.setting.permissions.title'),
            icon: <LineChartDots {...iconProps} />,
          },
        ],
      },
      {
        subTitle: t('settings.section.support'),
        data: [
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: uniswapUrls.walletFeedbackForm,
              headerTitle: t('settings.action.feedback'),
            },
            text: t('settings.action.feedback'),
            icon: <LikeSquare color="$neutral2" size="$icon.24" />,
          },
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: uniswapUrls.helpArticleUrls.mobileWalletHelp,
              headerTitle: t('settings.action.help'),
            },
            text: t('settings.action.help'),
            icon: <MessageQuestion {...svgProps} />,
          },
        ],
      },
      {
        subTitle: t('settings.section.about'),
        data: [
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: uniswapUrls.privacyPolicyUrl,
              headerTitle: t('settings.action.privacy'),
            },
            text: t('settings.action.privacy'),
            icon: <LockIcon {...svgProps} />,
          },
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: uniswapUrls.termsOfServiceUrl,
              headerTitle: t('settings.action.terms'),
            },
            text: t('settings.action.terms'),
            icon: <BookOpenIcon {...svgProps} />,
          },
        ],
      },
      {
        subTitle: 'Developer settings',
        isHidden: !isDevEnv(),
        data: [
          {
            screen: MobileScreens.Dev,
            text: 'Dev options',
            icon: <UniswapIcon {...svgProps} />,
          },
          { component: <OnboardingRow iconProps={svgProps} /> },
          { component: <ResetBehaviorHistoryRow iconProps={svgProps} /> },
        ],
      },
    ]
  }, [
    colors.neutral2,
    t,
    currentAppearanceSetting,
    currentFiatCurrencyInfo.code,
    currentLanguage,
    hapticsEnabled,
    onToggleEnableHaptics,
    noSignerAccountImported,
    deviceSupportsBiometrics,
    isTouchIdSupported,
    isFaceIdSupported,
    biometricsMethod,
    signerAccount?.address,
    walletNeedsRestore,
    hasCloudBackup,
    isTestnetModeEnabled,
    handleTestnetModeToggle,
    notificationOSPermission,
    navigation,
  ])

  const handleModalClose = useCallback(() => setIsTestnetModalOpen(false), [])

  return (
    <ScreenWithHeader centerElement={<Text variant="body1">{t('settings.title')}</Text>}>
      <TestnetModeModal isOpen={isTestnetModalOpen} onClose={handleModalClose} />
      <SettingsList
        keyExtractor={keyExtractor}
        sections={sections}
        ItemSeparatorComponent={renderItemSeparator}
        ListFooterComponent={<FooterSettings />}
        ListHeaderComponent={<WalletSettings />}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWithHeader>
  )
}

function keyExtractor(_item: SectionData, index: number): string {
  return 'settings' + index
}

function renderSectionFooter(): JSX.Element {
  return <Flex pt="$spacing8" />
}

function renderSectionHeader({ section }: { section: SettingsSection }): JSX.Element {
  return section.subTitle ? (
    <Flex backgroundColor="$surface1" py="$spacing8">
      <Text color="$neutral2" variant="body1">
        {section.subTitle}
      </Text>
    </Flex>
  ) : (
    <></>
  )
}

function renderItemSeparator(): JSX.Element {
  return <Flex pt="$spacing8" />
}
