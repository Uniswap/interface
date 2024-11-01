import React, { useState } from 'react'
import { Alert, I18nManager, ScrollView } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { BackButton } from 'src/components/buttons/BackButton'
import { Screen } from 'src/components/layout/Screen'
import { Flex, Switch, Text, TouchableArea } from 'ui/src'
import { CheckmarkCircle, CopyAlt } from 'ui/src/components/icons'
import { iconSizes, spacing } from 'ui/src/theme'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { resetDismissedWarnings } from 'uniswap/src/features/tokens/slice/slice'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { UniconSampleSheet } from 'wallet/src/components/DevelopmentOnly/UniconSampleSheet'
import { createOnboardingAccount } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { resetWallet } from 'wallet/src/features/wallet/slice'

export function DevScreen(): JSX.Element {
  const insets = useAppInsets()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccount()
  const [rtlEnabled, setRTLEnabled] = useState(I18nManager.isRTL)
  const sortedMnemonicAccounts = useSelector(selectSortedSignerMnemonicAccounts)
  const { data: deviceId } = useAsyncData(getUniqueId)

  const onPressResetTokenWarnings = (): void => {
    dispatch(resetDismissedWarnings())
  }

  const onPressCreate = async (): Promise<void> => {
    dispatch(
      createAccountsActions.trigger({
        accounts: [await createOnboardingAccount(sortedMnemonicAccounts)],
      }),
    )
  }

  const activateWormhole = (s: MobileScreens): void => {
    navigate(s)
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

  const onRemovePrivateKeys = async (): Promise<void> => {
    const addresses = await Keyring.getAddressesForStoredPrivateKeys()
    for (const address of addresses) {
      await Keyring.removePrivateKey(address)
    }
    Alert.alert('Private keys have been removed. Restart the app now!')
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
            <CheckmarkCircle size={iconSizes.icon16} />
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
          <TouchableArea mt="$spacing12" onPress={onRemovePrivateKeys}>
            <Text color="$neutral1">Remove private keys</Text>
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
