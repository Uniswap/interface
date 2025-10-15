import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBiometricUnlockDisableMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockDisableMutation'
import { useBiometricUnlockSetupMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockSetupMutation'
import { useHasBiometricUnlockCredential } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlock'
import { useShouldShowBiometricUnlockEnrollment } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlockEnrollment'
import { SettingsToggleRow } from 'src/app/features/settings/components/SettingsToggleRow'
import { EnterPasswordModal } from 'src/app/features/settings/password/EnterPasswordModal'
import { builtInBiometricCapabilitiesQuery } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'
import { Flex, GeneratedIcon, Text } from 'ui/src'
import { Button } from 'ui/src/components/buttons/Button/Button'
import { Fingerprint, HelpCenter } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
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
        />
      )}

      {modal === ShowModal.WaitingForBiometrics && (
        <WaitingForBiometricsModal onClose={hideWaitingForBiometricsModal} Icon={Icon} name={name} />
      )}
    </>
  )
}

/**
 * We render this component as a workaround because of this Chrome bug:
 * https://issues.chromium.org/issues/381056235
 *
 * Additional information:
 * https://www.notion.so/uniswaplabs/Extension-Biometric-Unlock-Issues-21ec52b2548b80328d6bf044cf3d8942
 *
 * We could consider removing or redesigning this modal once this bug is fixed.
 */
function WaitingForBiometricsModal({
  Icon,
  name,
  onClose,
}: {
  Icon: GeneratedIcon
  name: string
  onClose: () => void
}): JSX.Element | null {
  const { t } = useTranslation()

  const onPressGetHelp = useEvent((): void => {
    window.open(uniswapUrls.helpArticleUrls.extensionBiometricsEnrollment, '_blank')
  })

  return (
    <Modal name={ModalName.WaitingForBiometricsEnrollment} isModalOpen={true} onClose={onClose}>
      <Flex grow alignItems="flex-end" mb="$spacing16">
        <Flex row>
          <Button icon={<HelpCenter />} size="xsmall" emphasis="tertiary" onPress={onPressGetHelp}>
            {t('common.getHelp.button')}
          </Button>
        </Flex>
      </Flex>

      <Flex gap="$spacing16" alignItems="center">
        <Flex borderRadius="$rounded12" backgroundColor="$surface3" p="$padding16">
          <Icon color="$neutral1" size="$icon.28" />
        </Flex>

        <Text variant="heading3">
          {t('settings.setting.biometrics.extension.waitingForBiometricsModal.title', { biometricsMethod: name })}
        </Text>

        <Text textAlign="center" variant="body1" color="$neutral2">
          {t('settings.setting.biometrics.extension.waitingForBiometricsModal.content', { biometricsMethod: name })}
        </Text>
      </Flex>

      <Flex row mt="$spacing16">
        <Button emphasis="secondary" onPress={onClose}>
          {t('common.button.cancel')}
        </Button>
      </Flex>
    </Modal>
  )
}
