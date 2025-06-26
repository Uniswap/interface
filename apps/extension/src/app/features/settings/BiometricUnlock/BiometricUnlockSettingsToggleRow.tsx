import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useBiometricUnlockDisableMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockDisableMutation'
import { useBiometricUnlockSetupMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockSetupMutation'
import { useHasBiometricUnlockCredential } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlock'
import { useShouldShowBiometricUnlockEnrollment } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlockEnrollment'
import { SettingsToggleRow } from 'src/app/features/settings/components/SettingsToggleRow'
import { EnterPasswordModal } from 'src/app/features/settings/password/EnterPasswordModal'
import { builtInBiometricCapabilitiesQuery } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'
import { Fingerprint } from 'ui/src/components/icons'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function BiometricUnlockSettingsToggleRow(): JSX.Element | null {
  const { t } = useTranslation()
  const { value: isPasswordModalOpen, setTrue: showPasswordModal, setFalse: hidePasswordModal } = useBooleanState(false)

  const hasBiometricUnlockCredential = useHasBiometricUnlockCredential()
  const showBiometricUnlockEnrollment = useShouldShowBiometricUnlockEnrollment({ flow: 'settings' })

  // We want to show the toggle when the user has a credential even if enrollment is not available,
  // so that they can remove their passkey if they want to.
  const showBiometricUnlockToggle = hasBiometricUnlockCredential || showBiometricUnlockEnrollment

  const { data: biometricCapabilities } = useQuery(builtInBiometricCapabilitiesQuery({ t }))

  const { mutate: setupBiometricUnlock } = useBiometricUnlockSetupMutation()
  const { mutate: disableBiometricUnlock } = useBiometricUnlockDisableMutation()

  const handleToggleChange = useEvent(() => {
    if (hasBiometricUnlockCredential) {
      disableBiometricUnlock()
    } else {
      showPasswordModal()
    }
  })

  if (!showBiometricUnlockToggle) {
    return null
  }

  return (
    <>
      <SettingsToggleRow
        Icon={biometricCapabilities?.icon ?? Fingerprint}
        title={biometricCapabilities?.name ?? t('common.biometrics.generic')}
        checked={hasBiometricUnlockCredential}
        onCheckedChange={handleToggleChange}
      />

      {isPasswordModalOpen && (
        <EnterPasswordModal
          isOpen={true}
          onNext={(password): void => {
            hidePasswordModal()
            if (password) {
              setupBiometricUnlock(password)
            }
          }}
          onClose={hidePasswordModal}
          shouldReturnPassword
        />
      )}
    </>
  )
}
