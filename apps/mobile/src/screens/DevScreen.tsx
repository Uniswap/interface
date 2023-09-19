import React from 'react'
import { ScrollView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { BackButton } from 'src/components/buttons/BackButton'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { resetDismissedWarnings } from 'src/features/tokens/tokensSlice'
import { Screens } from 'src/screens/Screens'
import { Flex, Text, TouchableArea } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { resetWallet } from 'wallet/src/features/wallet/slice'

export function DevScreen(): JSX.Element {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()

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
    if (!activeAccount) return

    dispatch(resetWallet())
  }

  return (
    <SheetScreen>
      <Flex row justifyContent="flex-end" pb="$spacing12" pt="$spacing36" px="$spacing16">
        <BackButton />
      </Flex>
      <ScrollView>
        <Flex alignItems="center">
          <Text color="$neutral1" textAlign="center" variant="headlineSmall">
            {`Your Account: ${activeAccount?.address || 'none'}`}
          </Text>
          <Text mt="$spacing16" textAlign="center" variant="headlineSmall">
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
          <Text mt="$spacing12" textAlign="center" variant="bodyLarge">
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
        </Flex>
      </ScrollView>
    </SheetScreen>
  )
}
