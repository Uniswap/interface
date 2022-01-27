import { AuthenticationType, supportedAuthenticationTypesAsync } from 'expo-local-authentication'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStackNavigation } from 'src/app/navigation/types'
import FaceIdIcon from 'src/assets/icons/faceid.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex, Inset } from 'src/components/layout'
import { Modal } from 'src/components/modals/Modal'
import { Text } from 'src/components/Text'
import { BiometricAuthenticationStatus } from 'src/features/biometrics'
import { ElementName } from 'src/features/telemetry/constants'
import { logger } from 'src/utils/logger'

type BiometricModalProps = {
  authenticationStatus?: BiometricAuthenticationStatus
  show: boolean
  tryAuthenticate: () => void
}

export function BiometricModal({
  authenticationStatus,
  show,
  tryAuthenticate,
}: BiometricModalProps) {
  const { t } = useTranslation()
  const navigation = useAppStackNavigation()

  const supportedBiometricTypes = useSupportedBiometricTypes()

  if (
    !supportedBiometricTypes ||
    !(
      supportedBiometricTypes.includes(AuthenticationType.FINGERPRINT) ||
      supportedBiometricTypes.includes(AuthenticationType.FACIAL_RECOGNITION)
    )
  ) {
    return null
  }

  return (
    <Modal
      dimBackground={true}
      dismissable={false}
      position="bottom"
      showCloseButton={false}
      title={t('Secure your account')}
      visible={show}>
      <Inset all="md">
        <Flex centered gap="lg">
          <Flex centered bg="paleBlue" borderRadius="md" px="xxl" py="lg">
            <FaceIdIcon height={64} width={64} />
            <Text color="blue" variant="bodyBold">
              {t('Face ID')}
            </Text>
          </Flex>
          <Text color="gray400" variant="bodySm">
            {t(
              'Face ID or Touch ID is required in this early release to help safeguard your assets.'
            )}
            {authenticationStatus === BiometricAuthenticationStatus.MISSING_ENROLLMENT &&
              ' ' + t('Please enable Face ID or Touch ID.')}
          </Text>
          <Flex centered width="100%">
            <PrimaryButton
              label={
                authenticationStatus === BiometricAuthenticationStatus.MISSING_ENROLLMENT
                  ? t('Enable Face ID')
                  : t('Try again')
              }
              name={ElementName.TryAgain}
              width="100%"
              onPress={tryAuthenticate}
            />
            <TextButton name={ElementName.Back} onPress={() => navigation.popToTop()}>
              <Text variant="bodySm">{t('Cancel')}</Text>
            </TextButton>
          </Flex>
        </Flex>
      </Inset>
    </Modal>
  )
}

function useSupportedBiometricTypes() {
  const [supportedBiometricTypes, setSupportedBiometricTypes] = useState<AuthenticationType[]>()

  useEffect(() => {
    const getSupportedTypes = async () => {
      try {
        const supported = await supportedAuthenticationTypesAsync()
        setSupportedBiometricTypes(supported)
      } catch (e) {
        logger.error('Modal', 'useSupportedBiometricTypes', `Failed to get supported types: ${e}`)
      }
    }
    getSupportedTypes()
  }, [])

  return supportedBiometricTypes
}
