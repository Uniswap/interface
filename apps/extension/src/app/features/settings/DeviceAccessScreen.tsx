import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { useShouldShowBiometricUnlock } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlock'
import { useShouldShowBiometricUnlockEnrollment } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlockEnrollment'
import { BiometricAuthModal } from 'src/app/features/settings/BiometricUnlock/BiometricAuthModal'
import { BiometricUnlockSettingsToggleRow } from 'src/app/features/settings/BiometricUnlock/BiometricUnlockSettingsToggleRow'
import { SettingsItem } from 'src/app/features/settings/components/SettingsItem'
import { CreateNewPasswordModal } from 'src/app/features/settings/password/CreateNewPasswordModal'
import { EnterPasswordModal } from 'src/app/features/settings/password/EnterPasswordModal'
import { PasswordResetFlowState, usePasswordResetFlow } from 'src/app/features/settings/password/usePasswordResetFlow'
import { SettingsItemWithDropdown } from 'src/app/features/settings/SettingsItemWithDropdown'
import { builtInBiometricCapabilitiesQuery } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'
import { ExtensionState } from 'src/store/extensionReducer'
import { Flex, ScrollView } from 'ui/src'
import { Stopwatch } from 'ui/src/components/icons'
import { Key } from 'ui/src/components/icons/Key'
import { DeviceAccessTimeout, ORDERED_DEVICE_ACCESS_TIMEOUTS } from 'uniswap/src/features/settings/constants'
import { setDeviceAccessTimeout } from 'uniswap/src/features/settings/slice'

function getDeviceAccessTimeoutLabel(t: ReturnType<typeof useTranslation>['t'], timeout: DeviceAccessTimeout): string {
  switch (timeout) {
    case DeviceAccessTimeout.FiveMinutes:
      return t('settings.setting.deviceAccessTimeout.5minutes')
    case DeviceAccessTimeout.ThirtyMinutes:
      return t('settings.setting.deviceAccessTimeout.30minutes')
    case DeviceAccessTimeout.OneHour:
      return t('settings.setting.deviceAccessTimeout.1hour')
    case DeviceAccessTimeout.TwentyFourHours:
      return t('settings.setting.deviceAccessTimeout.24hours')
    case DeviceAccessTimeout.Never:
      return t('settings.setting.deviceAccessTimeout.never')
    default:
      return t('settings.setting.deviceAccessTimeout.30minutes')
  }
}

export function DeviceAccessScreen(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const deviceAccessTimeout = useSelector((state: ExtensionState) => state.userSettings.deviceAccessTimeout)

  const hasBiometricUnlockCredential = useShouldShowBiometricUnlock()
  const showBiometricUnlockEnrollment = useShouldShowBiometricUnlockEnrollment({ flow: 'settings' })
  const { data: biometricCapabilities } = useQuery(builtInBiometricCapabilitiesQuery({ t }))

  const {
    flowState,
    startPasswordReset,
    closeModal,
    onPasswordModalNext,
    onChangePasswordModalNext,
    onBiometricAuthModalClose,
  } = usePasswordResetFlow()

  return (
    <>
      <Flex fill backgroundColor="$surface1" gap="$spacing8">
        <ScreenHeader title={t('settings.setting.deviceAccess.title')} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Flex gap="$spacing16">
            {(hasBiometricUnlockCredential || showBiometricUnlockEnrollment) && <BiometricUnlockSettingsToggleRow />}
            <SettingsItemWithDropdown
              Icon={Stopwatch}
              items={ORDERED_DEVICE_ACCESS_TIMEOUTS.map((timeout) => {
                return {
                  label: getDeviceAccessTimeoutLabel(t, timeout),
                  value: timeout,
                }
              })}
              selected={getDeviceAccessTimeoutLabel(t, deviceAccessTimeout)}
              title={t('settings.setting.deviceAccessTimeout.title')}
              onSelect={(value) => {
                const timeout = value as DeviceAccessTimeout
                dispatch(setDeviceAccessTimeout(timeout))
              }}
            />
            <SettingsItem Icon={Key} title={t('settings.setting.password.title')} onPress={startPasswordReset} />
          </Flex>
        </ScrollView>
      </Flex>

      {(() => {
        switch (flowState) {
          case PasswordResetFlowState.EnterCurrentPassword:
            return (
              <EnterPasswordModal
                isOpen={true}
                onNext={onPasswordModalNext}
                onClose={() => closeModal(PasswordResetFlowState.EnterCurrentPassword)}
                shouldReturnPassword
                hideBiometrics={true}
              />
            )
          case PasswordResetFlowState.EnterNewPassword:
            return (
              <CreateNewPasswordModal
                isOpen={true}
                onNext={onChangePasswordModalNext}
                onClose={() => closeModal(PasswordResetFlowState.EnterNewPassword)}
              />
            )
          case PasswordResetFlowState.BiometricAuth:
            return biometricCapabilities ? (
              <BiometricAuthModal
                onClose={onBiometricAuthModalClose}
                biometricMethodName={biometricCapabilities.name}
                Icon={biometricCapabilities.icon}
                title={t('settings.setting.deviceAccess.reset.title', { biometricsMethod: biometricCapabilities.name })}
              />
            ) : null // If no biometric capabilities, this state should never be reached
          default:
            return null
        }
      })()}
    </>
  )
}
