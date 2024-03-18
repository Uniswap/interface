import React, { useState } from 'react'
import { I18nManager, ScrollView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UniconSampleSheet } from 'src/components/DevelopmentOnly/UniconSampleSheet'
import { BackButton } from 'src/components/buttons/BackButton'
import { Screen } from 'src/components/layout/Screen'
import { Screens } from 'src/screens/Screens'
import { Flex, Text, TouchableArea, useDeviceInsets } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { Switch } from 'wallet/src/components/buttons/Switch'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { resetDismissedWarnings } from 'wallet/src/features/tokens/tokensSlice'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { resetWallet } from 'wallet/src/features/wallet/slice'

export function DevScreen(): JSX.Element {
  const insets = useDeviceInsets()
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()
  const [rtlEnabled, setRTLEnabled] = useState(I18nManager.isRTL)

  const onPressResetTokenWarnings = (): void => {
    dispatch(resetDismissedWarnings())
  }

  const onPressCreate = (): void => {
    dispatch(createAccountActions.trigger())
  }

  const activateWormhole = (s: Screens): void => {
    navigate(s)
  }

  const onPressShowError = (): void => {
    const address = activeAccount?.address
    if (!address) {
      logger.debug(
        'DevScreen',
        'onPressShowError',
        'Cannot show error if activeAccount is undefined'
      )
      return
    }

    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        address,
        errorMessage: 'A scary new error has happened. Be afraid!!',
      })
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

  return (
    <Screen edges={['top']}>
      <Flex row justifyContent="flex-end" px="$spacing16" py="$spacing12">
        <BackButton />
      </Flex>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.spacing12 }}>
        <Flex alignItems="center">
          <Text color="$neutral1" textAlign="center" variant="heading3">
            {`Your Account: ${activeAccount?.address || 'none'}`}
          </Text>
          <Text mt="$spacing16" textAlign="center" variant="heading3">
            🌀🌀Screen Stargate🌀🌀
          </Text>
          <Flex centered row flexWrap="wrap">
            {Object.values(Screens).map((s) => (
              <TouchableArea
                key={s}
                m="$spacing8"
                testID={`dev_screen/${s}`}
                onPress={(): void => activateWormhole(s)}>
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
          <Flex row alignItems="center" gap="$spacing16" justifyContent="space-between">
            <Text>Force RTL (requires restart to apply)</Text>
            <Switch
              value={rtlEnabled}
              onValueChange={(value: boolean): void => {
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
