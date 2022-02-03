import { utils } from 'ethers'
import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { batch } from 'react-redux'
import { useAppDispatch } from 'src/app/hooks'
import { BackX } from 'src/components/buttons/BackX'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { useCurrentBlockTimestamp } from 'src/features/blocks/useCurrentBlockTimestamp'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useGasFee } from 'src/features/gas/useGasFee'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { NotificationSeverity } from 'src/features/notifications/types'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

export function DevScreen({ navigation }: any) {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()
  const [currentChain] = useState(ChainId.Rinkeby)

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

  const blockTimestamp = useCurrentBlockTimestamp(currentChain)

  const [fakeTx, setFakeTx] = useState<any>(undefined)
  const {
    isLoading: gasIsLoading,
    isError: gasIsError,
    data: gasInfo,
  } = useGasFee(ChainId.Rinkeby, fakeTx)
  const gasInfoReady = !gasIsLoading && !gasIsError && gasInfo
  const onPressComputeFee = () => {
    setFakeTx({
      to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Wrapped ETH address
      data: '0xd0e30db0', // `function deposit() payable`
      value: utils.parseEther('1.0'), // 1 ether
    })
  }

  const onPressShowError = () => {
    dispatch(
      pushNotification({
        message: 'A scary new error has happened. Be afraid!!',
        severity: NotificationSeverity.Error,
      })
    )
  }

  return (
    <SheetScreen>
      <Box flexDirection="row" justifyContent="flex-end" px="md" py="sm">
        <BackX />
      </Box>
      <ScrollView>
        <Box alignItems="center">
          <Text textAlign="center" variant="h3">
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
                testID={`dev_screen/${s}`}
                onPress={() => activateWormhole(s)}>
                {s}
              </TextButton>
            ))}
          </Box>
          <Text mt="sm" textAlign="center" variant="body">
            🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀
          </Text>

          <TextButton mt="md" onPress={onPressCreate}>
            Create Account
          </TextButton>
          <TextButton mt="sm" onPress={onPressGetBalance}>
            Get Balance
          </TextButton>
          <TextButton mt="sm" onPress={onPressToggleTestnets}>
            Toggle Testnets
          </TextButton>
          <TextButton mt="sm" onPress={onPressComputeFee}>
            Compute fee
          </TextButton>
          <TextButton mt="sm" onPress={onPressShowError}>
            Show global error
          </TextButton>
          <Text mt="xl" textAlign="center">
            {`Active Chains: ${activeChains}`}
          </Text>
          <Text mt="sm" textAlign="center">
            {`Current Chain: ${currentChain}`}
          </Text>
          <Text mt="sm" textAlign="center">
            {`Block Timestamp: ${blockTimestamp}`}
          </Text>
          {gasInfoReady && (
            <Text mt="sm" textAlign="center">
              {`Normal fee: ${gasInfo.fee.normal}`}
            </Text>
          )}
          <Text mt="sm" textAlign="center">
            {`Config: ${config.apiUrl} - Debug: ${config.debug}`}
          </Text>
        </Box>
      </ScrollView>
    </SheetScreen>
  )
}
