import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BackButton } from 'src/components/buttons/BackButton'
import { Switch } from 'src/components/buttons/Switch'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useCurrentBlockTimestamp } from 'src/features/blocks/useCurrentBlockTimestamp'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { useActiveChainIds } from 'src/features/chains/utils'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { resetDismissedWarnings } from 'src/features/tokens/tokensSlice'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { selectFlashbotsEnabled } from 'src/features/wallet/selectors'
import { resetWallet, toggleFlashbots } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { logger } from 'src/utils/logger'

export function DevScreen({ navigation }: any) {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()
  const [currentChain] = useState(ChainId.Goerli)
  const flashbotsEnabled = useAppSelector(selectFlashbotsEnabled)

  const onPressResetTokenWarnings = () => {
    dispatch(resetDismissedWarnings())
  }

  const onPressCreate = () => {
    dispatch(createAccountActions.trigger())
  }

  const activateWormhole = (s: Screens) => {
    navigation.navigate(s)
  }

  const activeChains = useActiveChainIds()
  const onPressToggleTestnets = () => {
    // always rely on the state of goerli
    const isGoerliActive = activeChains.includes(ChainId.Goerli)
    dispatch(setChainActiveStatus({ chainId: ChainId.Goerli, isActive: !isGoerliActive }))
  }

  const onToggleFlashbots = (enabled: boolean) => {
    dispatch(toggleFlashbots(enabled))
  }

  const blockTimestamp = useCurrentBlockTimestamp(currentChain)

  const onPressShowError = () => {
    const address = activeAccount?.address
    if (!address) {
      logger.error(
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

  const onPressResetOnboarding = () => {
    if (!activeAccount) return

    dispatch(resetWallet())
  }

  return (
    <SheetScreen>
      <Box flexDirection="row" justifyContent="flex-end" pb="sm" pt="xl" px="md">
        <BackButton />
      </Box>
      <ScrollView>
        <Box alignItems="center">
          <Text color="textPrimary" textAlign="center" variant="headlineSmall">
            {`Your Account: ${activeAccount?.address || 'none'}`}
          </Text>
          <Text mt="md" textAlign="center" variant="headlineSmall">
            🌀🌀Screen Stargate🌀🌀
          </Text>
          <Box alignItems="center" flexDirection="row" flexWrap="wrap" justifyContent="center">
            {Object.values(Screens).map((s) => (
              <TextButton
                key={s}
                m="xs"
                name={`DEBUG_${s}`}
                testID={`dev_screen/${s}`}
                textColor="textPrimary"
                onPress={() => activateWormhole(s)}>
                {s}
              </TextButton>
            ))}
          </Box>
          <Text mt="sm" textAlign="center" variant="bodyLarge">
            🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀
          </Text>
          <Flex row alignItems="center" justifyContent="space-between">
            <Text variant="bodyLarge">Use flashbots for transactions</Text>
            <Switch
              value={flashbotsEnabled}
              onValueChange={() => onToggleFlashbots(!flashbotsEnabled)}
            />
          </Flex>
          <TextButton mt="md" name="DEBUG_Create" textColor="textPrimary" onPress={onPressCreate}>
            Create account
          </TextButton>
          <TextButton
            mt="sm"
            name="DEBUG_ToggleTestnets"
            textColor="textPrimary"
            onPress={onPressToggleTestnets}>
            Toggle testnets
          </TextButton>
          <TextButton
            mt="sm"
            name="DEBUG_ResetTokenWarnings"
            textColor="textPrimary"
            onPress={onPressResetTokenWarnings}>
            Reset token warnings
          </TextButton>
          <TextButton
            mt="sm"
            name="DEBUG_ShowError"
            textColor="textPrimary"
            onPress={onPressShowError}>
            Show global error
          </TextButton>
          <TextButton
            mt="sm"
            name="DEBUG_ResetOnboarding"
            textColor="textPrimary"
            onPress={onPressResetOnboarding}>
            Reset onboarding
          </TextButton>
          <Text color="textPrimary" mt="xl" textAlign="center">
            {`Active Chains: ${activeChains}`}
          </Text>
          <Text color="textPrimary" mt="sm" textAlign="center">
            {`Current Chain: ${currentChain}`}
          </Text>
          <Text color="textPrimary" mt="sm" textAlign="center">
            {`Block Timestamp: ${blockTimestamp}`}
          </Text>
        </Box>
      </ScrollView>
    </SheetScreen>
  )
}
