import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { Switch } from 'src/components/buttons/Switch'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import { IS_IOS } from 'src/constants/globals'
import { enroll } from 'src/features/biometrics'
import {
  checkOsBiometricAuthEnabled,
  useBiometricAppSettings,
  useBiometricName,
  useBiometricPrompt,
  useDeviceSupportsBiometricAuth,
} from 'src/features/biometrics/hooks'
import {
  BiometricSettingType,
  setRequiredForAppAccess,
  setRequiredForTransactions,
} from 'src/features/biometrics/slice'
import { openSettings } from 'src/utils/linking'
import { Flex, Text, TouchableArea } from 'ui/src'

interface BiometricAuthSetting {
  onValueChange: (newValue: boolean) => void
  value: boolean
  text: string
  subText: string
}

type BiometricPromptTriggerArgs = {
  biometricAppSettingType: BiometricSettingType | null
  newValue: boolean
}

export function SettingsBiometricAuthScreen(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [showUnsafeWarningModal, setShowUnsafeWarningModal] = useState(false)
  const [unsafeWarningModalType, setUnsafeWarningModalType] = useState<BiometricSettingType | null>(
    null
  )
  const onCloseModal = useCallback(() => setShowUnsafeWarningModal(false), [])

  const { touchId } = useDeviceSupportsBiometricAuth()
  const authenticationTypeName = useBiometricName(touchId)
  const capitalizedAuthTypeName =
    authenticationTypeName.charAt(0).toUpperCase() + authenticationTypeName.slice(1)

  const { requiredForAppAccess, requiredForTransactions } = useBiometricAppSettings()
  const { trigger } = useBiometricPrompt<BiometricPromptTriggerArgs>(
    (args?: BiometricPromptTriggerArgs) => {
      if (!args) return
      const { biometricAppSettingType, newValue } = args
      switch (biometricAppSettingType) {
        case BiometricSettingType.RequiredForAppAccess:
          dispatch(setRequiredForAppAccess(newValue))
          break
        case BiometricSettingType.RequiredForTransactions:
          dispatch(setRequiredForTransactions(newValue))
          break
      }
    }
  )

  const options: BiometricAuthSetting[] = useMemo((): BiometricAuthSetting[] => {
    const handleFaceIdTurnedOff = (): void => {
      IS_IOS
        ? Alert.alert(
            t('{{capitalizedAuthTypeName}} is turned off', { capitalizedAuthTypeName }),
            t(
              '{{capitalizedAuthTypeName}} is currently turned off for Uniswap Wallet—you can turn it on in your system settings.',
              { capitalizedAuthTypeName }
            ),
            [{ text: t('Settings'), onPress: openSettings }, { text: t('Cancel') }]
          )
        : Alert.alert(
            t('{{capitalizedAuthTypeName}} is not setup', {
              capitalizedAuthTypeName,
              authenticationTypeName,
            }),
            t(
              '{{capitalizedAuthTypeName}} is not setup on your device. To use {{authenticationTypeName}}, set it up first in Settings.',
              { capitalizedAuthTypeName, authenticationTypeName }
            ),
            [{ text: t('Set up'), onPress: enroll }, { text: t('Cancel') }]
          )
    }

    return [
      {
        onValueChange: async (newRequiredForAppAccessValue): Promise<void> => {
          if (!newRequiredForAppAccessValue && !requiredForTransactions) {
            setShowUnsafeWarningModal(true)
            setUnsafeWarningModalType(BiometricSettingType.RequiredForAppAccess)
            return
          }

          if (await checkOsBiometricAuthEnabled()) {
            await trigger({
              biometricAppSettingType: BiometricSettingType.RequiredForAppAccess,
              newValue: newRequiredForAppAccessValue,
            })
            return
          }

          handleFaceIdTurnedOff()
        },
        value: requiredForAppAccess,
        text: t('App access'),
        subText: t('Require {{authenticationTypeName}} to open app', { authenticationTypeName }),
      },
      {
        onValueChange: async (newRequiredForTransactionsValue): Promise<void> => {
          if (!newRequiredForTransactionsValue && !requiredForAppAccess) {
            setShowUnsafeWarningModal(true)
            setUnsafeWarningModalType(BiometricSettingType.RequiredForTransactions)
            return
          }

          if (await checkOsBiometricAuthEnabled()) {
            await trigger({
              biometricAppSettingType: BiometricSettingType.RequiredForTransactions,
              newValue: newRequiredForTransactionsValue,
            })
            return
          }

          handleFaceIdTurnedOff()
        },
        value: requiredForTransactions,
        text: t('Transactions'),
        subText: t('Require {{authenticationTypeName}} to transact', { authenticationTypeName }),
      },
    ]
  }, [
    requiredForAppAccess,
    t,
    authenticationTypeName,
    capitalizedAuthTypeName,
    requiredForTransactions,
    trigger,
  ])

  const renderItem = ({
    item: { text, subText, value, onValueChange },
  }: ListRenderItemInfo<BiometricAuthSetting>): JSX.Element => {
    return (
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row shrink pr="$spacing12">
          <Flex gap="$spacing4">
            <Text variant="body1">{text}</Text>
            <Text color="$neutral2" variant="body3">
              {subText}
            </Text>
          </Flex>
        </Flex>
        <Flex grow alignItems="flex-end">
          <TouchableArea
            activeOpacity={1}
            onPress={(): void => {
              onValueChange(!value)
            }}>
            <Switch pointerEvents="none" value={value} onValueChange={onValueChange} />
          </TouchableArea>
        </Flex>
      </Flex>
    )
  }

  return (
    <>
      {showUnsafeWarningModal && (
        <BiometricAuthWarningModal
          isTouchIdDevice={touchId}
          onClose={onCloseModal}
          onConfirm={async (): Promise<void> => {
            await trigger({
              biometricAppSettingType: unsafeWarningModalType,
              // flip the bit
              newValue: !(unsafeWarningModalType === BiometricSettingType.RequiredForAppAccess
                ? requiredForAppAccess
                : requiredForTransactions),
            })
            setShowUnsafeWarningModal(false)
            setUnsafeWarningModalType(null)
          }}
        />
      )}
      <Screen>
        <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
          <Text variant="body1">
            {t('{{capitalizedAuthTypeName}}', { capitalizedAuthTypeName })}
          </Text>
        </BackHeader>
        <Flex p="$spacing24">
          <FlatList
            ItemSeparatorComponent={renderItemSeparator}
            data={options}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        </Flex>
      </Screen>
    </>
  )
}

const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing24" />
