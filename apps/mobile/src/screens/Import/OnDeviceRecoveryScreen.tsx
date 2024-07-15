import { NativeStackScreenProps } from '@react-navigation/native-stack'
import dayjs from 'dayjs'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import {
  OnDeviceRecoveryWalletCard,
  OnDeviceRecoveryWalletCardLoader,
} from 'src/screens/Import/OnDeviceRecoveryWalletCard'
import { RecoveryWalletInfo } from 'src/screens/Import/useOnDeviceRecoveryData'
import { hideSplashScreen } from 'src/utils/splashScreen'
import { Flex, Image, Text, TouchableArea, useSporeColors } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { PapersText } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { DynamicConfigs, OnDeviceRecoveryConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { useTimeout } from 'utilities/src/time/timing'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { AccountType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'

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
  const colors = useSporeColors()
  const { setRecoveredImportedAccounts } = useOnboardingContext()
  const recoveryLoadingTimeoutMs = useDynamicConfigValue(
    DynamicConfigs.OnDeviceRecovery,
    OnDeviceRecoveryConfigKey.AppLoadingTimeoutMs,
    FALLBACK_RECOVERY_LOADING_TIMEOUT_MS,
  )

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
      mnemonicIds.map(async (mnemonicId) => {
        if (mnemonicId !== selectedMnemonicId) {
          return Keyring.removeMnemonic(mnemonicId)
        }
      }),
    )
  }

  const clearNonSelectedStoredAddresses = async (): Promise<void> => {
    const storedAddresses = await Keyring.getAddressesForStoredPrivateKeys()
    await Promise.all(
      storedAddresses.map((address) => {
        if (!selectedRecoveryWalletInfos.find((walletInfo) => walletInfo.address === address)) {
          return Keyring.removePrivateKey(address)
        }
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
  }

  const onPressConfirm = async (): Promise<void> => {
    await clearNonSelectedStoredMnemonics()
    await clearNonSelectedStoredAddresses()
    setShowConfirmationModal(false)

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

  //Hides lock screen on next js render cycle, ensuring this component is loaded when the screen is hidden
  useTimeout(hideSplashScreen, 1)

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
    <Trace logImpression properties={{ mnemonicCount: mnemonicIds.length }} screen={OnboardingScreens.OnDeviceRecovery}>
      <Screen>
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
                  onPressCard={(recoveryAddressesInfos) => {
                    setSelectedMnemonicId(mnemonicId)
                    setSelectedRecoveryWalletInfos(recoveryAddressesInfos)
                    setShowConfirmationModal(true)
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
              <TouchableArea alignItems="center" hitSlop={16} mb="$spacing12" testID={TestID.WatchWallet}>
                <Text color="$accent1" variant="buttonLabel3" onPress={onPressOtherWallet}>
                  {t('onboarding.import.onDeviceRecovery.other_options')}
                </Text>
              </TouchableArea>
            </Flex>
          </Flex>
        </Flex>
        {showConfirmationModal && (
          <WarningModal
            caption={t('onboarding.import.onDeviceRecovery.warning.caption')}
            closeText={t('common.button.back')}
            confirmText={t('common.button.continue')}
            icon={<PapersText color={colors.neutral1.get()} size="$icon.20" strokeWidth={1.5} />}
            modalName={ModalName.OnDeviceRecoveryConfirmation}
            severity={WarningSeverity.None}
            title={t('onboarding.import.onDeviceRecovery.warning.title')}
            onClose={onPressClose}
            onConfirm={onPressConfirm}
          />
        )}
      </Screen>
    </Trace>
  )
}
