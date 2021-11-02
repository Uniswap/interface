import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
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
import { useAccounts, useActiveAccount } from 'src/features/wallet/hooks'
import { logger } from 'src/utils/logger'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Home>

export function DevScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const accounts = useAccounts()
  const activeAccount = useActiveAccount()
  const ethBalance = useActiveAccountEthBalance(ChainId.GOERLI)

  const onPressCreate = () => {
    dispatch(createAccountActions.trigger())
  }

  const onPressList = () => {
    logger.debug('HomeScreen', '', 'accounts', Object.values(accounts))
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

  const onPressHome = async () => {
    navigation.navigate(Screens.Home)
  }

  const activeChains = useActiveChainIds()
  const onPressToggleChain = () => {
    const isGoerliActive = activeChains.includes(ChainId.GOERLI)
    dispatch(setChainActiveStatus({ chainId: ChainId.GOERLI, isActive: !isGoerliActive }))
  }

  const blockTimestamp = useCurrentBlockTimestamp(ChainId.GOERLI)

  const { t } = useTranslation()

  return (
    <Screen>
      <Box alignItems="center">
        <Text variant="h3" textAlign="center" mt="xl">
          {t('Your Account: {{addr}}', { addr: activeAccount?.address || 'none' })}
        </Text>
        <Button label={'Home'} onPress={onPressHome} mt="md" />
        <Button label={t('Create Account')} onPress={onPressCreate} mt="md" />
        <Button label={t('List Accounts')} onPress={onPressList} mt="md" />
        <Button label={t('View Balances')} onPress={onPressViewBalances} mt="md" />
        <Button label={t('Send Token')} onPress={onPressSend} mt="md" />
        <Button label={t('Get Balance')} onPress={onPressGetBalance} mt="md" />
        <Button label={t('Toggle Goerli')} onPress={onPressToggleChain} mt="md" />
        <Text textAlign="center" mt="xl">
          {`Block Timestamp: ${blockTimestamp}`}
        </Text>
        <Text textAlign="center" mt="xl">
          {`Config: ${config.apiUrl} - Debug: ${config.debug}`}
        </Text>
      </Box>
    </Screen>
  )
}
