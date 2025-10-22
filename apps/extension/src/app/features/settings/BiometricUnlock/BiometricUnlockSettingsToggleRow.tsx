import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBiometricUnlockDisableMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockDisableMutation'
import { useBiometricUnlockSetupMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockSetupMutation'
import { useHasBiometricUnlockCredential } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlock'
import { useShouldShowBiometricUnlockEnrollment } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlockEnrollment'
import { BiometricAuthModal } from 'src/app/features/settings/BiometricUnlock/BiometricAuthModal'
import { SettingsToggleRow } from 'src/app/features/settings/components/SettingsToggleRow'
import { EnterPasswordModal } from 'src/app/features/settings/password/EnterPasswordModal'
import { builtInBiometricCapabilitiesQuery } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'
import { Fingerprint } from 'ui/src/components/icons'
import { useEvent } from 'utilities/src/react/hooks'

enum ShowModal {
  Password = 'password',
  WaitingForBiometrics = 'waiting',
}

export function BiometricUnlockSettingsToggleRow(): JSX.Element | null {
  const { t } = useTranslation()
  const [modal, setModal] = useState<ShowModal | null>(null)

  const showPasswordModal = useEvent(() => setModal(ShowModal.Password))
  const showWaitingForBiometricsModal = useEvent(() => setModal(ShowModal.WaitingForBiometrics))

  const hidePasswordModal = useEvent(() => {
    if (modal === ShowModal.Password) {
      setModal(null)
    }
  })

  const hideWaitingForBiometricsModal = useEvent(() => {
    if (modal === ShowModal.WaitingForBiometrics) {
      setModal(null)
    }
  })

  const hasBiometricUnlockCredential = useHasBiometricUnlockCredential()
  const showBiometricUnlockEnrollment = useShouldShowBiometricUnlockEnrollment({ flow: 'settings' })

  // We want to show the toggle when the user has a credential even if enrollment is not available,
  // so that they can remove their passkey if they want to.
  const showBiometricUnlockToggle = hasBiometricUnlockCredential || showBiometricUnlockEnrollment

  const { data: biometricCapabilities } = useQuery(builtInBiometricCapabilitiesQuery({ t }))

  const { mutate: setupBiometricUnlock } = useBiometricUnlockSetupMutation({ onSuccess: hideWaitingForBiometricsModal })
  const { mutate: disableBiometricUnlock } = useBiometricUnlockDisableMutation()

  const onPasswordModalNext = useEvent((password?: string): void => {
    hidePasswordModal()

    if (!password) {
      return
    }

    if (hasBiometricUnlockCredential) {
      disableBiometricUnlock()
    } else {
      showWaitingForBiometricsModal()
      setupBiometricUnlock(password)
    }
  })

  if (!showBiometricUnlockToggle) {
    return null
  }

  const Icon = biometricCapabilities?.icon ?? Fingerprint
  const name = biometricCapabilities?.name ?? t('common.biometrics.generic')

  return (
    <>
      <SettingsToggleRow
        Icon={Icon}
        title={name}
        checked={hasBiometricUnlockCredential}
        onCheckedChange={showPasswordModal}
      />

      {modal === ShowModal.Password && (
        <EnterPasswordModal
          isOpen={true}
          onNext={onPasswordModalNext}
          onClose={hidePasswordModal}
          shouldReturnPassword
          hideBiometrics={true}
        />
      )}

      {modal === ShowModal.WaitingForBiometrics && (
        <BiometricAuthModal
          onClose={hideWaitingForBiometricsModal}
          biometricMethodName={name}
          Icon={Icon}
          title={t('settings.setting.biometrics.extension.waitingForBiometricsModal.title', {
            biometricsMethod: name,
          })}
        />
      )}
    </>
  )
}
