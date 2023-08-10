import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { BackButton } from 'src/components/buttons/BackButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { resetDismissedWarnings } from 'src/features/tokens/tokensSlice'
import { Screens } from 'src/screens/Screens'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { useActiveChainIds } from 'wallet/src/features/chains/hooks'
import { setChainActiveStatus } from 'wallet/src/features/chains/slice'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { resetWallet } from 'wallet/src/features/wallet/slice'

export function DevScreen(): JSX.Element {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()
  const [currentChain] = useState(ChainId.Goerli)

  const onPressResetTokenWarnings = (): void => {
    dispatch(resetDismissedWarnings())
  }

  const onPressCreate = (): void => {
    dispatch(createAccountActions.trigger())
  }

  const activateWormhole = (s: Screens): void => {
    navigate(s)
  }

  const activeChains = useActiveChainIds()
  const onPressToggleTestnets = (): void => {
    // always rely on the state of goerli
    const isGoerliActive = activeChains.includes(ChainId.Goerli)
    dispatch(setChainActiveStatus({ chainId: ChainId.Goerli, isActive: !isGoerliActive }))
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
      <Box
        flexDirection="row"
        justifyContent="flex-end"
        pb="spacing12"
        pt="spacing36"
        px="spacing16">
        <BackButton />
      </Box>
      <ScrollView>
        <Box alignItems="center">
          <Text color="neutral1" textAlign="center" variant="headlineSmall">
            {`Your Account: ${activeAccount?.address || 'none'}`}
          </Text>
          <Text mt="spacing16" textAlign="center" variant="headlineSmall">
            🌀🌀Screen Stargate🌀🌀
          </Text>
          <Box alignItems="center" flexDirection="row" flexWrap="wrap" justifyContent="center">
            {Object.values(Screens).map((s) => (
              <TouchableArea
                key={s}
                m="spacing8"
                testID={`dev_screen/${s}`}
                onPress={(): void => activateWormhole(s)}>
                <Text color="neutral1">{s}</Text>
              </TouchableArea>
            ))}
          </Box>
          <Text mt="spacing12" textAlign="center" variant="bodyLarge">
            🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀
          </Text>
          <TouchableArea mt="spacing16" onPress={onPressCreate}>
            <Text color="neutral1">Create account</Text>
          </TouchableArea>
          <TouchableArea mt="spacing12" onPress={onPressToggleTestnets}>
            <Text color="neutral1">Toggle testnets</Text>
          </TouchableArea>
          <TouchableArea mt="spacing12" onPress={onPressResetTokenWarnings}>
            <Text color="neutral1">Reset token warnings</Text>
          </TouchableArea>
          <TouchableArea mt="spacing12" onPress={onPressShowError}>
            <Text color="neutral1">Show global error</Text>
          </TouchableArea>
          <TouchableArea mt="spacing12" onPress={onPressResetOnboarding}>
            <Text color="neutral1">Reset onboarding</Text>
          </TouchableArea>
          <Text color="neutral1" mt="spacing36" textAlign="center">
            {`Active Chains: ${activeChains}`}
          </Text>
          <Text color="neutral1" mt="spacing12" textAlign="center">
            {`Current Chain: ${currentChain}`}
          </Text>
        </Box>
      </ScrollView>
    </SheetScreen>
  )
}
