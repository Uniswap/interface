import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RootStackParamList } from 'src/app/navTypes'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { config } from 'src/config'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export function HomeScreen({ navigation }: Props) {
  const onClickSend = () => {
    navigation.navigate('Transfer')
  }
  const { t } = useTranslation()
  return (
    <Screen>
      <Box alignItems="center">
        <Text textAlign="center" mt="xl">
          {t('Hello world')}
        </Text>
        <Text textAlign="center" mt="xl">
          {t('Interpolated {{text}}', { text: 'myString' })}
        </Text>
        <Button label={t('Send')} onPress={onClickSend} mt="md" />
        <Text textAlign="center" mt="xl">
          {`Config: ${config.apiUrl} - Debug: ${config.debug}`}
        </Text>
      </Box>
    </Screen>
  )
}
