import React, { useState } from 'react'
import { I18nManager, ScrollView } from 'react-native'
import { getUniqueIdSync } from 'react-native-device-info'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { BackButton } from 'src/components/buttons/BackButton'
import { Screen } from 'src/components/layout/Screen'
import { Flex, Switch, Text, TouchableArea } from 'ui/src'
import { CheckmarkCircle, CopyAlt } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import {
  resetDismissedBridgedAssetWarnings,
  resetDismissedCompatibleAddressWarnings,
  resetDismissedWarnings,
} from 'uniswap/src/features/tokens/warnings/slice/slice'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { logger } from 'utilities/src/logger/logger'
import { UniconSampleSheet } from 'wallet/src/components/DevelopmentOnly/UniconSampleSheet'
import { createOnboardingAccount } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { resetWallet } from 'wallet/src/features/wallet/slice'

/**
 * Dev screen accessible in the Settings screen.
 *
 * @deprecated Use the Experiments modal instead.
 */
export function DevScreen(): JSX.Element {
  const insets = useAppInsets()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccount()
  const [rtlEnabled, setRTLEnabled] = useState(I18nManager.isRTL)
  const sortedMnemonicAccounts = useSelector(selectSortedSignerMnemonicAccounts)
  const deviceId = getUniqueIdSync()

  const onPressResetTokenWarnings = (): void => {
    dispatch(resetDismissedWarnings())
    dispatch(resetDismissedCompatibleAddressWarnings())
    dispatch(resetDismissedBridgedAssetWarnings())
  }

  const onPressCreate = async (): Promise<void> => {
    dispatch(
      createAccountsActions.trigger({
        accounts: [await createOnboardingAccount(sortedMnemonicAccounts)],
      }),
    )
  }

  const activateWormhole = (s: MobileScreens): void => {
    switch (s) {
      case MobileScreens.SettingsCloudBackupPasswordCreate:
        navigate(s, {
          address: '0x0000000000000000000000000000000000000000',
        })
        break

      case MobileScreens.SettingsCloudBackupPasswordConfirm:
        navigate(s, {
          address: '0x0000000000000000000000000000000000000000',
          password: 'password',
        })
        break

      default:
        navigate(s)
    }
  }

  const onPressShowError = (): void => {
    const address = activeAccount?.address
    if (!address) {
      logger.debug('DevScreen', 'onPressShowError', 'Cannot show error if activeAccount is undefined')
      return
    }

    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        address,
        errorMessage: 'A scary new error has happened. Be afraid!!',
      }),
    )
  }

  const onPressResetOnboarding = (): void => {
    if (!activeAccount) {
      return
    }

    dispatch(resetWallet())
  }

  const [showUniconsModal, setShowUniconsModal] = useState(false)

  const onPressShowUniconsModal = (): void => {
    setShowUniconsModal((prev) => !prev)
  }

  const [showSuccessNotification, setShowSuccessNotification] = useState(false)

  const onPressCopy = async (): Promise<void> => {
    if (!deviceId) {
      return
    }

    await setClipboard(deviceId)
    setShowSuccessNotification(true)
  }

  return (
    <Screen edges={['top']}>
      {showSuccessNotification && (
        <Flex centered pointerEvents="box-none" position="absolute" top={0} width="100%" zIndex="$modal">
          <Flex
            centered
            row
            backgroundColor="$surface3"
            borderRadius="$roundedFull"
            gap="$spacing4"
            mt="$spacing20"
            p="$spacing8"
          >
            <Text>Device id copied!</Text>
            <CheckmarkCircle size="$icon.16" />
          </Flex>
        </Flex>
      )}
      <Flex row justifyContent="flex-start" px="$spacing16" py="$spacing12">
        <BackButton />
      </Flex>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.spacing12 }}>
        <Flex>
          <Text textAlign="center">{`Your address: ${activeAccount?.address || 'none'}`}</Text>
          <Flex centered>
            <Flex centered row gap="$spacing4">
              <Text>Your device id</Text>
              <TouchableArea onPress={onPressCopy}>
                <CopyAlt color="$neutral3" size="$icon.16" />
              </TouchableArea>
            </Flex>
            <Text>{deviceId}</Text>
          </Flex>
          <Text mt="$spacing16" textAlign="center" variant="heading3">
            🌀🌀Screen Stargate🌀🌀
          </Text>
          <Flex centered row flexWrap="wrap">
            {Object.values(MobileScreens).map((s) => (
              <TouchableArea key={s} m="$spacing8" testID={`dev_screen/${s}`} onPress={(): void => activateWormhole(s)}>
                <Text color="$neutral1">{s}</Text>
              </TouchableArea>
            ))}
          </Flex>
          <Text mt="$spacing12" textAlign="center" variant="body1">
            🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀
          </Text>
          <TouchableArea mt="$spacing16" onPress={onPressCreate}>
            <Text color="$neutral1">Create account</Text>
          </TouchableArea>
          <TouchableArea mt="$spacing12" onPress={onPressResetTokenWarnings}>
            <Text color="$neutral1">Reset token warnings</Text>
          </TouchableArea>
          <TouchableArea mt="$spacing12" onPress={onPressShowError}>
            <Text color="$neutral1">Show global error</Text>
          </TouchableArea>
          <TouchableArea mt="$spacing12" onPress={onPressResetOnboarding}>
            <Text color="$neutral1">Reset onboarding</Text>
          </TouchableArea>
          <Flex row alignItems="center" gap="$spacing16" justifyContent="space-between" mt="$spacing12">
            <Text>Force RTL (requires restart to apply)</Text>
            <Switch
              checked={rtlEnabled}
              variant="branded"
              onCheckedChange={(value: boolean): void => {
                I18nManager.forceRTL(value)
                setRTLEnabled(value)
              }}
            />
          </Flex>
          <TouchableArea mt="$spacing12" onPress={onPressShowUniconsModal}>
            <Text color="$neutral1">Show Unicons sheet</Text>
          </TouchableArea>
        </Flex>
      </ScrollView>
      {showUniconsModal ? <UniconSampleSheet onClose={() => setShowUniconsModal(false)} /> : null}
    </Screen>
  )
}
