import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { SharedEventName } from '@uniswap/analytics-events'
import { DynamicConfigs, OnDeviceRecoveryConfigKey, useDynamicConfigValue } from '@universe/gating'
import dayjs from 'dayjs'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { useHideSplashScreen } from 'src/features/splashScreen/useHideSplashScreen'
import {
  OnDeviceRecoveryWalletCard,
  OnDeviceRecoveryWalletCardLoader,
} from 'src/screens/Import/OnDeviceRecoveryWalletCard'
import { RecoveryWalletInfo } from 'src/screens/Import/useOnDeviceRecoveryData'
import { Flex, Image, Text, TouchableArea } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { PapersText } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { logger } from 'utilities/src/logger/logger'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.OnDeviceRecovery>

const LOADING_COUNT = 3
const FALLBACK_RECOVERY_LOADING_TIMEOUT_MS = 60000

export function OnDeviceRecoveryScreen({
  navigation,
  route: {
    params: { mnemonicIds },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const { setRecoveredImportedAccounts } = useOnboardingContext()
  const recoveryLoadingTimeoutMs = useDynamicConfigValue({
    config: DynamicConfigs.OnDeviceRecovery,
    key: OnDeviceRecoveryConfigKey.AppLoadingTimeoutMs,
    defaultValue: FALLBACK_RECOVERY_LOADING_TIMEOUT_MS,
  })
  const hideSplashScreen = useHideSplashScreen()

  const [selectedMnemonicId, setSelectedMnemonicId] = useState<string>()
  const [selectedRecoveryWalletInfos, setSelectedRecoveryWalletInfos] = useState<RecoveryWalletInfo[]>([])

  const [hasAnySignificantWallets, setHasAnySignificantWallets] = useState(false)
  const [loadedWallets, setLoadedWallets] = useState(0)
  const [screenLoading, setScreenLoading] = useState(true)

  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  const onPressOtherWallet = async (): Promise<void> => {
    setSelectedMnemonicId(undefined)
    setSelectedRecoveryWalletInfos([])
    setShowConfirmationModal(true)
  }

  const clearNonSelectedStoredMnemonics = async (): Promise<void> => {
    await Promise.all(
      mnemonicIds.map(async (mnemonicId: string) => {
        if (mnemonicId !== selectedMnemonicId) {
          return Keyring.removeMnemonic(mnemonicId)
        }
        return Promise.resolve()
      }),
    )
  }

  const clearNonSelectedStoredAddresses = async (): Promise<void> => {
    const storedAddresses = await Keyring.getAddressesForStoredPrivateKeys()
    await Promise.all(
      storedAddresses.map((address) => {
        if (
          !selectedRecoveryWalletInfos.find((walletInfo) =>
            // TODO(WALL-7065): Update to support solana
            areAddressesEqual({
              addressInput1: { address: walletInfo.address, platform: Platform.EVM },
              addressInput2: { address, platform: Platform.EVM },
            }),
          )
        ) {
          return Keyring.removePrivateKey(address)
        }
        return Promise.resolve()
      }),
    )
  }

  const onWalletLoad = useCallback(
    (significantWalletCount: number) => {
      setLoadedWallets((prev) => {
        const loaded = prev + 1
        logger.debug('OnDeviceRecoveryScreen', 'onLoadComplete', `${loaded} of ${mnemonicIds.length} loaded`)
        return loaded
      })

      if (significantWalletCount > 0) {
        setHasAnySignificantWallets(true)
      }
    },
    [mnemonicIds.length],
  )

  const onPressClose = (): void => {
    setSelectedMnemonicId(undefined)
    setSelectedRecoveryWalletInfos([])
    setShowConfirmationModal(false)

    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.OnDeviceRecoveryModalCancel,
    })
  }

  const onPressConfirm = async (): Promise<void> => {
    await clearNonSelectedStoredMnemonics()
    await clearNonSelectedStoredAddresses()
    setShowConfirmationModal(false)

    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.OnDeviceRecoveryModalConfirm,
    })

    if (selectedMnemonicId && selectedRecoveryWalletInfos.length) {
      setRecoveredImportedAccounts(
        selectedRecoveryWalletInfos.map((walletInfo, index): SignerMnemonicAccount => {
          return {
            type: AccountType.SignerMnemonic,
            mnemonicId: selectedMnemonicId,
            name: t('onboarding.wallet.defaultName', { number: index + 1 }),
            address: walletInfo.address,
            derivationIndex: walletInfo.derivationIndex,
            timeImportedMs: dayjs().valueOf(),
            pushNotificationsEnabled: true,
          }
        }),
      )
      navigation.navigate(OnboardingScreens.Notifications, {
        importType: ImportType.OnDeviceRecovery,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      })
    } else {
      navigation.navigate(OnboardingScreens.Landing, {
        importType: ImportType.NotYetSelected,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      })
    }
  }

  useEffect(() => {
    if (loadedWallets >= mnemonicIds.length) {
      setScreenLoading(false)
    }
  }, [loadedWallets, mnemonicIds.length])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (screenLoading) {
        setScreenLoading(false)
        logger.warn(
          'OnDeviceRecoveryScreen',
          'useTimeout',
          `Loading timeout triggered after ${recoveryLoadingTimeoutMs}ms`,
        )
      }
    }, recoveryLoadingTimeoutMs)
    return () => clearTimeout(timeout)
  }, [recoveryLoadingTimeoutMs, screenLoading])

  // If all wallets are loaded and there are no wallets with a balance/usernames, show them all
  const showAllWallets = !screenLoading && !hasAnySignificantWallets

  return (
    <ReactNavigationPerformanceView screenName={OnboardingScreens.OnDeviceRecovery}>
      <Trace
        logImpression
        properties={{ mnemonicCount: mnemonicIds.length }}
        screen={OnboardingScreens.OnDeviceRecovery}
      >
        <Screen onLayout={hideSplashScreen}>
          <Flex grow p="$spacing24">
            <Flex alignItems="flex-start" gap="$spacing16">
              <Image height={iconSizes.icon36} source={UNISWAP_LOGO} width={iconSizes.icon36} />
              <Text variant="subheading1">{t('onboarding.import.onDeviceRecovery.title')}</Text>
              <Text color="$neutral2" variant="subheading2">
                {t('onboarding.import.onDeviceRecovery.subtitle')}
              </Text>
            </Flex>
            <ScrollView style={{ flex: 1, flexGrow: 1, flexShrink: 1, display: 'flex' }}>
              <Flex gap="$spacing12" justifyContent="flex-start" pt="$spacing28">
                {mnemonicIds.map((mnemonicId) => (
                  <OnDeviceRecoveryWalletCard
                    key={mnemonicId}
                    mnemonicId={mnemonicId}
                    screenLoading={screenLoading}
                    showAllWallets={showAllWallets}
                    onLoadComplete={onWalletLoad}
                    onPressCard={async (recoveryAddressesInfos) => {
                      setSelectedMnemonicId(mnemonicId)
                      setSelectedRecoveryWalletInfos(recoveryAddressesInfos)
                      if (mnemonicIds.length > 1) {
                        setShowConfirmationModal(true)
                      } else {
                        await onPressConfirm()
                      }

                      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
                        element: ElementName.OnDeviceRecoveryWallet,
                      })
                    }}
                    onPressViewRecoveryPhrase={() => {
                      navigation.navigate(OnboardingScreens.OnDeviceRecoveryViewSeedPhrase, {
                        mnemonicId,
                        importType: ImportType.OnDeviceRecovery,
                        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
                      })
                    }}
                  />
                ))}
                {screenLoading
                  ? Array(LOADING_COUNT)
                      .fill(0)
                      .map((_, index) => (
                        <Flex key={`loading-${index}`}>
                          <OnDeviceRecoveryWalletCardLoader index={index} totalCount={LOADING_COUNT} />
                        </Flex>
                      ))
                  : null}
              </Flex>
            </ScrollView>

            <Flex justifyContent="flex-end">
              <Flex alignItems="center" gap="$spacing8" justifyContent="center">
                <Text color="$neutral3" variant="body3" onPress={onPressOtherWallet}>
                  {t('onboarding.import.onDeviceRecovery.other_options.label')}
                </Text>
                <Trace logPress element={ElementName.OnDeviceRecoveryImportOther}>
                  <TouchableArea alignItems="center" hitSlop={16} mb="$spacing12" testID={TestID.WatchWallet}>
                    <Text color="$accent1" variant="buttonLabel2" onPress={onPressOtherWallet}>
                      {t('onboarding.import.onDeviceRecovery.other_options')}
                    </Text>
                  </TouchableArea>
                </Trace>
              </Flex>
            </Flex>
          </Flex>
          <WarningModal
            caption={t('onboarding.import.onDeviceRecovery.warning.caption', {
              cloudProvider: getCloudProviderName(),
            })}
            rejectText={t('common.button.back')}
            acknowledgeText={t('common.button.continue')}
            icon={<PapersText color="$neutral1" size="$icon.20" strokeWidth={1.5} />}
            isOpen={showConfirmationModal}
            modalName={ModalName.OnDeviceRecoveryConfirmation}
            severity={WarningSeverity.None}
            title={t('onboarding.import.onDeviceRecovery.warning.title')}
            onClose={onPressClose}
            onAcknowledge={onPressConfirm}
          />
        </Screen>
      </Trace>
    </ReactNavigationPerformanceView>
  )
}
