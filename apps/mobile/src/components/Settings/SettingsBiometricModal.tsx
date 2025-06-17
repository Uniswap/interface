import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { BiometricAuthWarningModal } from 'src/components/Settings/BiometricAuthWarningModal'
import { enroll } from 'src/features/biometrics/biometrics-utils'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useDeviceSupportsBiometricAuth } from 'src/features/biometrics/useDeviceSupportsBiometricAuth'
import {
  checkOsBiometricAuthEnabled,
  useBiometricName,
  useBiometricPrompt,
} from 'src/features/biometricsSettings/hooks'
import {
  BiometricSettingType,
  setRequiredForAppAccess,
  setRequiredForTransactions,
} from 'src/features/biometricsSettings/slice'
import { openSettings } from 'src/utils/linking'
import { Flex, Switch, Text, TouchableArea } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isAndroid, isIOS } from 'utilities/src/platform'

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

export function SettingsBiometricModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [showUnsafeWarningModal, setShowUnsafeWarningModal] = useState(false)
  const [unsafeWarningModalType, setUnsafeWarningModalType] = useState<BiometricSettingType | null>(null)
  const onCloseModal = useCallback(() => setShowUnsafeWarningModal(false), [])
  const { onClose } = useReactNavigationModal()

  const { touchId } = useDeviceSupportsBiometricAuth()
  const biometricsMethod = useBiometricName(touchId)

  const { requiredForAppAccess, requiredForTransactions } = useBiometricAppSettings()
  const { trigger } = useBiometricPrompt<BiometricPromptTriggerArgs>((args?: BiometricPromptTriggerArgs) => {
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
  })

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
            ],
          )
        : Alert.alert(
            isAndroid
              ? t('settings.setting.biometrics.unavailable.title.android')
              : t('settings.setting.biometrics.unavailable.title.ios', { biometricsMethod }),
            isAndroid
              ? t('settings.setting.biometrics.unavailable.message.android')
              : t('settings.setting.biometrics.unavailable.message.ios', { biometricsMethod }),
            [{ text: t('common.button.setup'), onPress: enroll }, { text: t('common.button.cancel') }],
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
      <Flex row justifyContent="space-between">
        <Flex row shrink pr="$spacing12">
          <Flex gap="$spacing4">
            <Text color="$neutral1" variant="subheading2">
              {text}
            </Text>
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
            }}
          >
            <Switch checked={value} pointerEvents="none" variant="branded" onCheckedChange={onValueChange} />
          </TouchableArea>
        </Flex>
      </Flex>
    )
  }

  return (
    <Modal name={ModalName.BiometricsModal} onClose={onClose}>
      <BiometricAuthWarningModal
        isOpen={showUnsafeWarningModal}
        isTouchIdDevice={touchId}
        rejectText={t('common.button.cancel')}
        acknowledgeText={t('common.button.disable')}
        onClose={onCloseModal}
        onConfirm={async (): Promise<void> => {
          await trigger({
            params: {
              biometricAppSettingType: unsafeWarningModalType,
              newValue: !(unsafeWarningModalType === BiometricSettingType.RequiredForAppAccess
                ? requiredForAppAccess
                : requiredForTransactions),
            },
          })
          setShowUnsafeWarningModal(false)
          setUnsafeWarningModalType(null)
        }}
      />
      <Flex animation="fast" gap="$spacing16" pb="$spacing60" px="$spacing24" width="100%">
        <Flex centered>
          <Text color="$neutral1" variant="subheading1">
            {isAndroid ? t('settings.setting.biometrics.title') : biometricsMethod}
          </Text>
        </Flex>
        <Flex>
          <FlatList
            ItemSeparatorComponent={renderItemSeparator}
            data={options}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}

const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing24" />
