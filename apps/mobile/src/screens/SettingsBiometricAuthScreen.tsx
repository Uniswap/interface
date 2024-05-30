import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
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
import { Flex, Text, TouchableArea } from 'ui/src'
import { isAndroid, isIOS } from 'uniswap/src/utils/platform'
import { Switch } from 'wallet/src/components/buttons/Switch'
import { openSettings } from 'wallet/src/utils/linking'

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
  const biometricsMethod = useBiometricName(touchId)

  const { requiredForAppAccess, requiredForTransactions } = useBiometricAppSettings()
  const { trigger } = useBiometricPrompt<BiometricPromptTriggerArgs>(
    (args?: BiometricPromptTriggerArgs) => {
      if (!args) {
        return
      }
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
    const handleOSBiometricAuthTurnedOff = (): void => {
      isIOS
        ? Alert.alert(
            isAndroid
              ? t('settings.setting.biometrics.off.title.android')
              : t('settings.setting.biometrics.off.title.ios', { biometricsMethod }),
            isAndroid
              ? t('settings.setting.biometrics.off.message.android')
              : t('settings.setting.biometrics.off.message.ios', { biometricsMethod }),
            [
              { text: t('common.navigation.systemSettings'), onPress: openSettings },
              { text: t('common.button.cancel') },
            ]
          )
        : Alert.alert(
            isAndroid
              ? t('settings.setting.biometrics.unavailable.title.android')
              : t('settings.setting.biometrics.unavailable.title.ios', { biometricsMethod }),
            isAndroid
              ? t('settings.setting.biometrics.unavailable.message.android')
              : t('settings.setting.biometrics.unavailable.message.ios', { biometricsMethod }),
            [
              { text: t('common.button.setup'), onPress: enroll },
              { text: t('common.button.cancel') },
            ]
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

          if (newRequiredForAppAccessValue) {
            // We only need to check if biometrics are enabled at the OS level when turning this setting on.
            // We can skip this check when turning it off because the user will be prompted to authenticate via passcode anyway.
            const isOSBiometricAuthEnabled = await checkOsBiometricAuthEnabled()

            if (!isOSBiometricAuthEnabled) {
              handleOSBiometricAuthTurnedOff()
              return
            }
          }

          await trigger({
            params: {
              biometricAppSettingType: BiometricSettingType.RequiredForAppAccess,
              newValue: newRequiredForAppAccessValue,
            },
          })
        },
        value: requiredForAppAccess,
        text: t('settings.setting.biometrics.appAccess.title'),
        subText: isAndroid
          ? t('settings.setting.biometrics.appAccess.subtitle.android')
          : t('settings.setting.biometrics.appAccess.subtitle.ios', { biometricsMethod }),
      },
      {
        onValueChange: async (newRequiredForTransactionsValue): Promise<void> => {
          if (!newRequiredForTransactionsValue && !requiredForAppAccess) {
            setShowUnsafeWarningModal(true)
            setUnsafeWarningModalType(BiometricSettingType.RequiredForTransactions)
            return
          }

          if (newRequiredForTransactionsValue) {
            // We only need to check if biometrics are enabled at the OS level when turning this setting on.
            // We can skip this check when turning it off because the user will be prompted to authenticate via passcode anyway.
            const isOSBiometricAuthEnabled = await checkOsBiometricAuthEnabled()

            if (!isOSBiometricAuthEnabled) {
              handleOSBiometricAuthTurnedOff()
              return
            }
          }

          await trigger({
            params: {
              biometricAppSettingType: BiometricSettingType.RequiredForTransactions,
              newValue: newRequiredForTransactionsValue,
            },
          })
        },
        value: requiredForTransactions,
        text: t('settings.setting.biometrics.transactions.title'),
        subText: isAndroid
          ? t('settings.setting.biometrics.transactions.subtitle.android')
          : t('settings.setting.biometrics.transactions.subtitle.ios', { biometricsMethod }),
      },
    ]
  }, [requiredForAppAccess, t, biometricsMethod, requiredForTransactions, trigger])

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
              params: {
                biometricAppSettingType: unsafeWarningModalType,
                // flip the bit
                newValue: !(unsafeWarningModalType === BiometricSettingType.RequiredForAppAccess
                  ? requiredForAppAccess
                  : requiredForTransactions),
              },
            })
            setShowUnsafeWarningModal(false)
            setUnsafeWarningModalType(null)
          }}
        />
      )}
      <Screen>
        <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
          <Text variant="body1">
            {isAndroid ? t('settings.setting.biometrics.title') : biometricsMethod}
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
