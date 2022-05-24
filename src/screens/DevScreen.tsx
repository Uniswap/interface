import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { batch } from 'react-redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BackX } from 'src/components/buttons/BackX'
import { Switch } from 'src/components/buttons/Switch'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { useCurrentBlockTimestamp } from 'src/features/blocks/useCurrentBlockTimestamp'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { useActiveChainIds } from 'src/features/chains/utils'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { resetDismissedWarnings } from 'src/features/tokens/tokensSlice'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import {
  resetWallet,
  selectFlashbotsEnabled,
  toggleFlashbots,
} from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { logger } from 'src/utils/logger'

export function DevScreen({ navigation }: any) {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()
  const [currentChain] = useState(ChainId.Rinkeby)
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

  const onPressGetBalance = async () => {
    if (!activeAccount) return
    dispatch(fetchBalancesActions.trigger(activeAccount.address))
  }

  const activeChains = useActiveChainIds()
  const onPressToggleTestnets = () => {
    // always rely on the state of rinkeby
    const isRinkebyActive = activeChains.includes(ChainId.Rinkeby)
    batch(() => {
      dispatch(setChainActiveStatus({ chainId: ChainId.Rinkeby, isActive: !isRinkebyActive }))
      dispatch(setChainActiveStatus({ chainId: ChainId.Goerli, isActive: !isRinkebyActive }))
    })
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
      <Box flexDirection="row" justifyContent="flex-end" px="md" py="sm">
        <BackX />
      </Box>
      <ScrollView>
        <Box alignItems="center">
          <Text color="deprecated_textColor" textAlign="center" variant="h3">
            {`Your Account: ${activeAccount?.address || 'none'}`}
          </Text>
          <Text mt="md" textAlign="center" variant="h3">
            🌀🌀Screen Stargate🌀🌀
          </Text>
          <Box alignItems="center" flexDirection="row" flexWrap="wrap" justifyContent="center">
            {Object.values(Screens).map((s) => (
              <TextButton
                key={s}
                m="xs"
                name={`DEBUG_${s}`}
                testID={`dev_screen/${s}`}
                textColor="deprecated_textColor"
                onPress={() => activateWormhole(s)}>
                {s}
              </TextButton>
            ))}
          </Box>
          <Text mt="sm" textAlign="center" variant="body1">
            🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀
          </Text>
          <Flex row alignItems="center" justifyContent="space-between">
            <Text variant="body1">Use flashbots for transactions</Text>
            <Switch
              value={flashbotsEnabled}
              onValueChange={() => onToggleFlashbots(!flashbotsEnabled)}
            />
          </Flex>
          <TextButton
            mt="md"
            name="DEBUG_Create"
            textColor="deprecated_textColor"
            onPress={onPressCreate}>
            Create Account
          </TextButton>
          <TextButton
            mt="sm"
            name="DEBUG_GetBalance"
            textColor="deprecated_textColor"
            onPress={onPressGetBalance}>
            Get Balance
          </TextButton>
          <TextButton
            mt="sm"
            name="DEBUG_ToggleTestnets"
            textColor="deprecated_textColor"
            onPress={onPressToggleTestnets}>
            Toggle Testnets
          </TextButton>
          <TextButton
            mt="sm"
            name="DEBUG_ResetTokenWarnings"
            textColor="deprecated_textColor"
            onPress={onPressResetTokenWarnings}>
            Reset Token Warnings
          </TextButton>
          <TextButton
            mt="sm"
            name="DEBUG_ShowError"
            textColor="deprecated_textColor"
            onPress={onPressShowError}>
            Show global error
          </TextButton>
          <TextButton
            mt="sm"
            name="DEBUG_ResetOnboarding"
            textColor="deprecated_textColor"
            onPress={onPressResetOnboarding}>
            Reset onboarding
          </TextButton>
          <Text color="deprecated_textColor" mt="xl" textAlign="center">
            {`Active Chains: ${activeChains}`}
          </Text>
          <Text color="deprecated_textColor" mt="sm" textAlign="center">
            {`Current Chain: ${currentChain}`}
          </Text>
          <Text color="deprecated_textColor" mt="sm" textAlign="center">
            {`Block Timestamp: ${blockTimestamp}`}
          </Text>
        </Box>
      </ScrollView>
    </SheetScreen>
  )
}
