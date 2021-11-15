import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { utils } from 'ethers'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { useCurrentBlockTimestamp } from 'src/features/blocks/useCurrentBlockTimestamp'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { useActiveChainIds } from 'src/features/chains/hooks'
import { useGasFee } from 'src/features/gas/useGasFee'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { createAccountActions } from 'src/features/wallet/createAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Home>

export function DevScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()
  const [currentChain] = useState(ChainId.RINKEBY)

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
  const onPressToggleRinkeby = () => {
    const isRinkebyActive = activeChains.includes(ChainId.RINKEBY)
    dispatch(setChainActiveStatus({ chainId: ChainId.RINKEBY, isActive: !isRinkebyActive }))
  }

  const blockTimestamp = useCurrentBlockTimestamp(currentChain)

  const [fakeTx, setFakeTx] = useState<any>(undefined)
  const {
    isLoading: gasIsLoading,
    isError: gasIsError,
    data: gasInfo,
  } = useGasFee(ChainId.RINKEBY, fakeTx)
  const gasInfoReady = !gasIsLoading && !gasIsError && gasInfo
  const onPressComputeFee = () => {
    setFakeTx({
      to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Wrapped ETH address
      data: '0xd0e30db0', // `function deposit() payable`
      value: utils.parseEther('1.0'), // 1 ether
    })
  }

  // imports test account for easy development/testing
  useTestAccount()

  const { t } = useTranslation()

  return (
    <Screen>
      <ScrollView>
        <Box alignItems="center">
          <Text variant="h3" textAlign="center">
            {t('Your Account: {{addr}}', { addr: activeAccount?.address || 'none' })}
          </Text>
          <Text variant="h3" mt="md" textAlign="center">
            🌀🌀Screen Stargate🌀🌀
          </Text>
          <Box flexDirection="row" alignItems="center" justifyContent="center" flexWrap="wrap">
            {Object.values(Screens).map((s) => (
              <Button label={s} onPress={() => activateWormhole(s)} m="xs" />
            ))}
          </Box>
          <Text variant="body" mt="sm" textAlign="center">
            🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀
          </Text>

          <Button label={t('Create Account')} onPress={onPressCreate} mt="md" />
          <Button label={t('Get Balance')} onPress={onPressGetBalance} mt="sm" />
          <Button label={t('Toggle Rinkeby')} onPress={onPressToggleRinkeby} mt="sm" />
          <Button label={t('Compute fee')} onPress={onPressComputeFee} mt="sm" />
          <Text textAlign="center" mt="xl">
            {`Active Chains: ${activeChains}`}
          </Text>
          <Text textAlign="center" mt="sm">
            {`Current Chain: ${currentChain}`}
          </Text>
          <Text textAlign="center" mt="sm">
            {`Block Timestamp: ${blockTimestamp}`}
          </Text>
          {gasInfoReady && (
            <Text textAlign="center" mt="sm">
              {`Normal fee: ${gasInfo.fee.normal}`}
            </Text>
          )}
          <Text textAlign="center" mt="sm">
            {`Config: ${config.apiUrl} - Debug: ${config.debug}`}
          </Text>
        </Box>
      </ScrollView>
    </Screen>
  )
}
