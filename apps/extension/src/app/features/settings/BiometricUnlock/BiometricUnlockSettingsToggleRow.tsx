import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { biometricUnlockCredentialQuery } from 'src/app/features/biometricUnlock/biometricUnlockCredentialQuery'
import { useBiometricUnlockDisableMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockDisableMutation'
import { useBiometricUnlockSetupMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockSetupMutation'
import { SettingsToggleRow } from 'src/app/features/settings/components/SettingsToggleRow'
import { EnterPasswordModal } from 'src/app/features/settings/password/EnterPasswordModal'
import { builtInBiometricCapabilitiesQuery } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function BiometricUnlockSettingsToggleRow(): JSX.Element | null {
  const { t } = useTranslation()
  const { value: isPasswordModalOpen, setTrue: showPasswordModal, setFalse: hidePasswordModal } = useBooleanState(false)

  const { data: biometricUnlockCredential } = useQuery(biometricUnlockCredentialQuery())
  const { data: biometricCapabilities } = useQuery(builtInBiometricCapabilitiesQuery({ t }))

  const { mutate: setupBiometricUnlock } = useBiometricUnlockSetupMutation()
  const { mutate: disableBiometricUnlock } = useBiometricUnlockDisableMutation()

  const hasBiometricUnlockCredential = !!biometricUnlockCredential

  const handleToggleChange = useEvent(() => {
    if (hasBiometricUnlockCredential) {
      disableBiometricUnlock()
    } else {
      showPasswordModal()
    }
  })

  if (!biometricCapabilities?.hasBuiltInBiometricSensor) {
    return null
  }

  return (
    <>
      <SettingsToggleRow
        Icon={biometricCapabilities.icon}
        title={biometricCapabilities.name}
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
