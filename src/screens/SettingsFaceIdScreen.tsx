import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { BackButton } from 'src/components/buttons/BackButton'
import { Switch } from 'src/components/buttons/Switch'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import {
  BiometricSettingType,
  setRequiredForAppAccess,
  setRequiredForTransactions,
} from 'src/features/biometrics/slice'

interface FaceIdSetting {
  onValueChange: (newValue: boolean) => void
  value: boolean
  text: string
  subText: string
}

export function SettingsFaceIdScreen() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const { requiredForAppAccess, requiredForTransactions } = useBiometricAppSettings()
  const { trigger, modal } = useBiometricPrompt(({ biometricAppSettingType, newValue }) => {
    switch (biometricAppSettingType) {
      case BiometricSettingType.RequiredForAppAccess:
        dispatch(setRequiredForAppAccess(newValue))
        break
      case BiometricSettingType.RequiredForTransactions:
        dispatch(setRequiredForTransactions(newValue))
        break
    }
  })

  const options: FaceIdSetting[] = useMemo((): FaceIdSetting[] => {
    return [
      {
        onValueChange: (newValue) =>
          trigger({
            biometricAppSettingType: BiometricSettingType.RequiredForAppAccess,
            newValue,
          }),
        value: requiredForAppAccess,
        text: t('App access'),
        subText: t('Require Face ID to open app'),
      },
      {
        onValueChange: (newValue) =>
          trigger({
            biometricAppSettingType: BiometricSettingType.RequiredForTransactions,
            newValue,
          }),
        value: requiredForTransactions,
        text: t('Transactions'),
        subText: t('Require Face ID to transact'),
      },
    ]
  }, [t, requiredForAppAccess, requiredForTransactions, trigger])

  const renderItem = ({
    item: { text, subText, value, onValueChange },
  }: ListRenderItemInfo<FaceIdSetting>) => {
    return (
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" px="sm">
        <Flex row>
          <Flex gap="none">
            <Text fontWeight="500" variant="subhead">
              {text}
            </Text>
            <Text color="textSecondary" fontWeight="400" variant="smallLabel">
              {subText}
            </Text>
          </Flex>
        </Flex>
        <Switch value={value} onValueChange={onValueChange} />
      </Box>
    )
  }

  return (
    <Screen p="lg">
      <Flex alignItems="center" flexDirection="row" mb="xl">
        <BackButton color="textSecondary" />
        <Text variant="largeLabel">Face ID</Text>
      </Flex>

      <FlatList
        ItemSeparatorComponent={() => <Box bg="backgroundOutline" height={1} my="md" />}
        data={options}
        renderItem={renderItem}
      />
      {modal}
    </Screen>
  )
}
