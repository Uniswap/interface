import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RootStackParamList } from 'src/app/navTypes'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { TransferTokenForm } from 'src/features/transfer/TransferTokenForm'

type Props = NativeStackScreenProps<RootStackParamList, 'Transfer'>

export function TransferTokenScreen({ navigation }: Props) {
  const onClickBack = () => {
    navigation.goBack()
  }
  const { t } = useTranslation()
  return (
    <Screen>
      <Box alignItems="center">
        <Text textAlign="center">{t('Send those tokens around')}</Text>
        <TransferTokenForm />
        <Button label={t('Back')} onPress={onClickBack} />
      </Box>
    </Screen>
  )
}
