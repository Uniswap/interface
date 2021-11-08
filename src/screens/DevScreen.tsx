import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useActiveAccountEthBalance } from 'src/features/balances/hooks'
import { useCurrentBlockTimestamp } from 'src/features/blocks/useCurrentBlockTimestamp'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { useActiveChainIds } from 'src/features/chains/hooks'
import { createAccountActions } from 'src/features/wallet/createAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { logger } from 'src/utils/logger'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Home>

export function DevScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()
  const [currentChain] = useState(ChainId.RINKEBY)
  const ethBalance = useActiveAccountEthBalance(ChainId.RINKEBY)

  const onPressCreate = () => {
    dispatch(createAccountActions.trigger())
  }

  const onPressImportAccount = () => {
    navigation.navigate(Screens.ImportAccount)
  }

  const onPressList = () => {
    navigation.navigate(Screens.Accounts)
  }

  const onPressSend = () => {
    navigation.navigate(Screens.Transfer)
  }

  const onPressViewBalances = () => {
    navigation.navigate(Screens.Balances)
  }

  const onPressGetBalance = async () => {
    if (!activeAccount) return
    dispatch(fetchBalancesActions.trigger(activeAccount.address))
    logger.debug('HomeScreen', '', 'balances', ethBalance)
  }

  const onPressSwap = () => navigation.navigate(Screens.Swap)

  const onPressHome = async () => {
    navigation.navigate(Screens.Home)
  }

  const activeChains = useActiveChainIds()
  const onPressToggleRinkeby = () => {
    const isRinkebyActive = activeChains.includes(ChainId.RINKEBY)
    dispatch(setChainActiveStatus({ chainId: ChainId.RINKEBY, isActive: !isRinkebyActive }))
  }

  const blockTimestamp = useCurrentBlockTimestamp(currentChain)

  const { t } = useTranslation()

  return (
    <Screen>
      <Box alignItems="center">
        <Text variant="h3" textAlign="center" mt="xl">
          {t('Your Account: {{addr}}', { addr: activeAccount?.address || 'none' })}
        </Text>
        <Button label={'Home'} onPress={onPressHome} mt="md" />
        <Button label={t('Create Account')} onPress={onPressCreate} mt="md" />
        <Button label={t('Import Account')} onPress={onPressImportAccount} mt="md" />
        <Button label={t('List Accounts')} onPress={onPressList} mt="md" />
        <Button label={t('View Balances')} onPress={onPressViewBalances} mt="md" />
        <Button label={t('Send Token')} onPress={onPressSend} mt="md" />
        <Button label={t('Get Balance')} onPress={onPressGetBalance} mt="md" />
        <Button label={t('Swap')} onPress={onPressSwap} mt="md" />
        <Button label={t('Toggle Rinkeby')} onPress={onPressToggleRinkeby} mt="md" />
        <Text textAlign="center" mt="xl">
          {`Active Chains: ${activeChains}`}
        </Text>
        <Text textAlign="center" mt="sm">
          {`Current Chain: ${currentChain}`}
        </Text>
        <Text textAlign="center" mt="sm">
          {`Block Timestamp: ${blockTimestamp}`}
        </Text>
        <Text textAlign="center" mt="sm">
          {`Config: ${config.apiUrl} - Debug: ${config.debug}`}
        </Text>
      </Box>
    </Screen>
  )
}
