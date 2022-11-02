import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { BackButton } from 'src/components/buttons/BackButton'
import { Switch } from 'src/components/buttons/Switch'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import {
  useBiometricAppSettings,
  useBiometricPrompt,
  useDeviceSupportsBiometricAuth,
  useOsBiometricAuthEnabled,
} from 'src/features/biometrics/hooks'
import {
  BiometricSettingType,
  setRequiredForAppAccess,
  setRequiredForTransactions,
} from 'src/features/biometrics/slice'
import { openSettings } from 'src/utils/linking'

interface BiometricAuthSetting {
  onValueChange: (newValue: boolean) => void
  value: boolean
  text: string
  subText: string
}

export function SettingsBiometricAuthScreen() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const osBiometricAuthEnabled = useOsBiometricAuthEnabled()
  const { touchId } = useDeviceSupportsBiometricAuth()
  const authenticationTypeName = touchId ? 'Touch' : 'Face'

  const { requiredForAppAccess, requiredForTransactions } = useBiometricAppSettings()
  const { trigger } = useBiometricPrompt(({ biometricAppSettingType, newValue }) => {
    switch (biometricAppSettingType) {
      case BiometricSettingType.RequiredForAppAccess:
        dispatch(setRequiredForAppAccess(newValue))
        break
      case BiometricSettingType.RequiredForTransactions:
        dispatch(setRequiredForTransactions(newValue))
        break
    }
  })

  const options: BiometricAuthSetting[] = useMemo((): BiometricAuthSetting[] => {
    const handleFaceIdTurnedOff = () => {
      Alert.alert(
        t(
          '{{authenticationTypeName}} ID is currently turned off for Uniswap Wallet—you can turn it on in your system settings.',
          { authenticationTypeName }
        ),
        '',
        [
          { text: t('Settings'), onPress: openSettings },
          {
            text: t('Cancel'),
          },
        ]
      )
    }

    return [
      {
        onValueChange: (newValue) => {
          osBiometricAuthEnabled
            ? trigger({
                biometricAppSettingType: BiometricSettingType.RequiredForAppAccess,
                newValue,
              })
            : handleFaceIdTurnedOff()
        },
        value: requiredForAppAccess,
        text: t('App access'),
        subText: t('Require {{authenticationTypeName}} ID to open app', { authenticationTypeName }),
      },
      {
        onValueChange: (newValue) => {
          osBiometricAuthEnabled
            ? trigger({
                biometricAppSettingType: BiometricSettingType.RequiredForTransactions,
                newValue,
              })
            : handleFaceIdTurnedOff()
        },
        value: requiredForTransactions,
        text: t('Transactions'),
        subText: t('Require {{authenticationTypeName}} ID to transact', { authenticationTypeName }),
      },
    ]
  }, [
    requiredForAppAccess,
    t,
    authenticationTypeName,
    requiredForTransactions,
    osBiometricAuthEnabled,
    trigger,
  ])

  const renderItem = ({
    item: { text, subText, value, onValueChange },
  }: ListRenderItemInfo<BiometricAuthSetting>) => {
    return (
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" px="sm">
        <Flex row>
          <Flex gap="none">
            <Text variant="subheadLarge">{text}</Text>
            <Text color="textSecondary" variant="buttonLabelSmall">
              {subText}
            </Text>
          </Flex>
        </Flex>
        <TouchableArea
          activeOpacity={1}
          onPress={() => {
            onValueChange(!value)
          }}>
          <Switch pointerEvents="none" value={value} onValueChange={onValueChange} />
        </TouchableArea>
      </Box>
    )
  }

  return (
    <Screen p="lg">
      <Flex alignItems="center" flexDirection="row" mb="xl">
        <BackButton color="textSecondary" />
        <Text variant="buttonLabelLarge">
          {t('{{authenticationTypeName}} ID', { authenticationTypeName })}
        </Text>
      </Flex>

      <FlatList
        ItemSeparatorComponent={() => <Box bg="backgroundOutline" height={1} my="md" />}
        data={options}
        renderItem={renderItem}
      />
    </Screen>
  )
}
