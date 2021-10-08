import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { RootStackParamList } from 'src/app/navTypes'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { config } from 'src/config'
import { createAccountActions } from 'src/features/wallet/createAccount'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const { activeAccount, accounts } = useAppSelector((state) => state.wallet)

  const onClickCreate = () => {
    dispatch(createAccountActions.trigger())
  }

  const onClickList = () => {
    // eslint-disable-next-line no-console
    console.log(Object.values(accounts))
  }

  const onClickSend = () => {
    navigation.navigate('Transfer')
  }

  const { t } = useTranslation()

  return (
    <Screen>
      <Box alignItems="center">
        <Text variant="h3" textAlign="center" mt="xl">
          {t('Your Account: {{addr}}', { addr: activeAccount?.address || 'none' })}
        </Text>
        <Button label={t('Create Account')} onPress={onClickCreate} mt="md" />
        <Button label={t('List Accounts')} onPress={onClickList} mt="md" />
        <Button label={t('Send Token')} onPress={onClickSend} mt="md" />
        <Text textAlign="center" mt="xl">
          {`Config: ${config.apiUrl} - Debug: ${config.debug}`}
        </Text>
      </Box>
    </Screen>
  )
}
