import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { useWalletProviders } from 'src/app/walletContext'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { config } from 'src/config'
import { SupportedChainId } from 'src/constants/chains'
import { createAccountActions } from 'src/features/wallet/createAccount'
import { logger } from 'src/utils/logger'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Home>

export function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const { activeAccount, accounts } = useAppSelector((state) => state.wallet)

  const onPressCreate = () => {
    dispatch(createAccountActions.trigger())
  }

  const onPressList = () => {
    logger.debug(Object.values(accounts))
  }

  const onPressSend = () => {
    navigation.navigate(Screens.Transfer)
  }

  const providers = useWalletProviders()
  const onPressGetBalance = async () => {
    const goerliProvider = providers.getProvider(SupportedChainId.GOERLI)
    if (!activeAccount) throw new Error('No active account')
    const balance = await goerliProvider.getBalance(activeAccount.address)
    logger.debug('Balance:', balance.toString())
  }

  const { t } = useTranslation()

  return (
    <Screen>
      <Box alignItems="center">
        <Text variant="h3" textAlign="center" mt="xl">
          {t('Your Account: {{addr}}', { addr: activeAccount?.address || 'none' })}
        </Text>
        <Button label={t('Create Account')} onPress={onPressCreate} mt="md" />
        <Button label={t('List Accounts')} onPress={onPressList} mt="md" />
        <Button label={t('Send Token')} onPress={onPressSend} mt="md" />
        <Button label={t('Get Balance')} onPress={onPressGetBalance} mt="md" />
        <Text textAlign="center" mt="xl">
          {`Config: ${config.apiUrl} - Debug: ${config.debug}`}
        </Text>
      </Box>
    </Screen>
  )
}
