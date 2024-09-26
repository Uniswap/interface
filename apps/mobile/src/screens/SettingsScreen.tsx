import { useNavigation } from '@react-navigation/core'
import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useDispatch, useSelector } from 'react-redux'
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
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { APP_FEEDBACK_LINK } from 'src/constants/urls'
import { useBiometricContext } from 'src/features/biometrics/context'
import { useBiometricName, useDeviceSupportsBiometricAuth } from 'src/features/biometrics/hooks'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { Flex, IconProps, Text, useDeviceInsets, useSporeColors } from 'ui/src'
import BookOpenIcon from 'ui/src/assets/icons/book-open.svg'
import ContrastIcon from 'ui/src/assets/icons/contrast.svg'
import FaceIdIcon from 'ui/src/assets/icons/faceid.svg'
import FingerprintIcon from 'ui/src/assets/icons/fingerprint.svg'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import MessageQuestion from 'ui/src/assets/icons/message-question.svg'
import UniswapIcon from 'ui/src/assets/icons/uniswap-logo.svg'
import {
  Chart,
  Coins,
  Feedback,
  Key,
  Language,
  LineChartDots,
  OSDynamicCloudIcon,
  ShieldQuestion,
  WavePulse,
} from 'ui/src/components/icons'
import { iconSizes, spacing } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { setHideSmallBalances, setHideSpamTokens } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { isDevEnv } from 'utilities/src/environment/env'
import { isAndroid } from 'utilities/src/platform'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { selectHapticsEnabled, setHapticsUserSettingEnabled } from 'wallet/src/features/appearance/slice'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

// avoids rendering during animation which makes it laggy
// set to a bit above the Switch animation "simple" which is 80ms
const AVOID_RENDER_DURING_ANIMATION_MS = 100

export function SettingsScreen(): JSX.Element {
  const navigation = useNavigation<SettingsStackNavigationProp & OnboardingStackNavigationProp>()
  const dispatch = useDispatch()
  const colors = useSporeColors()
  const insets = useDeviceInsets()
  const { deviceSupportsBiometrics } = useBiometricContext()
  const { t } = useTranslation()

  // check if device supports biometric authentication, if not, hide option
  const { touchId: isTouchIdSupported, faceId: isFaceIdSupported } = useDeviceSupportsBiometricAuth()

  const biometricsMethod = useBiometricName(isTouchIdSupported)
  const currentAppearanceSetting = useCurrentAppearanceSetting()
  const currentFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const { originName: currentLanguage } = useCurrentLanguageInfo()

  const hideSmallBalances = useHideSmallBalancesSetting()
  const onToggleHideSmallBalances = useCallback(() => {
    setTimeout(() => {
      dispatch(setHideSmallBalances(!hideSmallBalances))
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [dispatch, hideSmallBalances])

  const hideSpamTokens = useHideSpamTokensSetting()
  const onToggleHideSpamTokens = useCallback(() => {
    setTimeout(() => {
      dispatch(setHideSpamTokens(!hideSpamTokens))
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [dispatch, hideSpamTokens])

  const hapticsUserEnabled = useSelector(selectHapticsEnabled)
  const onToggleEnableHaptics = useCallback(() => {
    setTimeout(() => {
      dispatch(setHapticsUserSettingEnabled(!hapticsUserEnabled))
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [dispatch, hapticsUserEnabled])

  // Signer account info
  const signerAccount = useSignerAccounts()[0]
  // We sync backup state across all accounts under the same mnemonic, so can check status with any account.
  const hasCloudBackup = signerAccount?.backups?.includes(BackupType.Cloud)
  const noSignerAccountImported = !signerAccount
  const { walletNeedsRestore } = useWalletRestore()

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
            screen: MobileScreens.SettingsAppearance,
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
            text: t('settings.setting.smallBalances.title'),
            icon: <Chart {...iconProps} />,
            isToggleEnabled: hideSmallBalances,
            onToggle: onToggleHideSmallBalances,
          },
          {
            text: t('settings.setting.unknownTokens.title'),
            icon: <ShieldQuestion {...iconProps} />,
            isToggleEnabled: hideSpamTokens,
            onToggle: onToggleHideSpamTokens,
          },
          {
            text: t('settings.setting.hapticTouch.title'),
            icon: <WavePulse {...iconProps} />,
            isToggleEnabled: hapticsUserEnabled,
            onToggle: onToggleEnableHaptics,
          },
          {
            screen: MobileScreens.SettingsPrivacy,
            text: t('settings.setting.privacy.title'),
            icon: <LineChartDots {...iconProps} />,
          },
          // @TODO: [MOB-250] add back testnet toggle once we support testnets
        ],
      },
      {
        subTitle: t('settings.section.security'),
        isHidden: noSignerAccountImported,
        data: [
          ...(deviceSupportsBiometrics
            ? [
                {
                  screen: MobileScreens.SettingsBiometricAuth as MobileScreens.SettingsBiometricAuth,
                  isHidden: !isTouchIdSupported && !isFaceIdSupported,
                  text: isAndroid ? t('settings.setting.biometrics.title') : biometricsMethod,
                  icon: isTouchIdSupported ? <FingerprintIcon {...svgProps} /> : <FaceIdIcon {...svgProps} />,
                },
              ]
            : []),
          {
            screen: MobileScreens.SettingsViewSeedPhrase,
            text: t('settings.setting.recoveryPhrase.title'),
            icon: <Key {...iconProps} />,
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
            icon: <OSDynamicCloudIcon color="$neutral2" size="$icon.24" />,
            isHidden: noSignerAccountImported,
          },
        ],
      },
      {
        subTitle: t('settings.section.support'),
        data: [
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: APP_FEEDBACK_LINK,
              headerTitle: t('settings.action.feedback'),
            },
            text: t('settings.action.feedback'),
            icon: <Feedback color="$neutral2" size="$icon.24" />,
          },
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: uniswapUrls.helpArticleUrls.walletHelp,
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
    hideSmallBalances,
    onToggleHideSmallBalances,
    hideSpamTokens,
    onToggleHideSpamTokens,
    hapticsUserEnabled,
    onToggleEnableHaptics,
    noSignerAccountImported,
    deviceSupportsBiometrics,
    isTouchIdSupported,
    isFaceIdSupported,
    biometricsMethod,
    signerAccount?.address,
    walletNeedsRestore,
    hasCloudBackup,
  ])

  const renderItem = ({
    item,
  }: ListRenderItemInfo<SettingsSectionItem | SettingsSectionItemComponent>): JSX.Element | null => {
    if (item.isHidden) {
      return null
    }
    if ('component' in item) {
      return item.component
    }
    return <SettingsRow key={item.screen} navigation={navigation} page={item} />
  }

  return (
    <HeaderScrollScreen alwaysShowCenterElement centerElement={<Text variant="body1">{t('settings.title')}</Text>}>
      <Flex pb={insets.bottom - spacing.spacing16} pt="$spacing12" px="$spacing24">
        <SectionList
          ItemSeparatorComponent={renderItemSeparator}
          ListFooterComponent={<FooterSettings />}
          ListHeaderComponent={<WalletSettings />}
          initialNumToRender={20}
          keyExtractor={(_item, index): string => 'settings' + index}
          renderItem={renderItem}
          renderSectionFooter={(): JSX.Element => <Flex pt="$spacing24" />}
          renderSectionHeader={({ section: { subTitle } }): JSX.Element => (
            <Flex backgroundColor="$surface1" py="$spacing12">
              <Text color="$neutral2" variant="body1">
                {subTitle}
              </Text>
            </Flex>
          )}
          sections={sections.filter((p) => !p.isHidden)}
          showsVerticalScrollIndicator={false}
        />
      </Flex>
    </HeaderScrollScreen>
  )
}

const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing8" />
