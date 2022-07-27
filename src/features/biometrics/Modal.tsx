import { AuthenticationType, supportedAuthenticationTypesAsync } from 'expo-local-authentication'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
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
  cancel: () => void
}

export function BiometricModal({
  authenticationStatus,
  show,
  tryAuthenticate,
  cancel,
}: BiometricModalProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

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
          <Flex centered borderRadius="md" px="xxl" py="lg">
            <FaceIdIcon color={theme.colors.accentActiveSoft} height={64} width={64} />
            <Text color="accentActive" variant="body">
              {t('Face ID')}
            </Text>
          </Flex>
          <Text color="textSecondary" variant="caption">
            {t('Face ID or Touch ID is required to help safeguard your assets.')}
            {authenticationStatus === BiometricAuthenticationStatus.MissingEnrollment &&
              ' ' + t('Please enable Face ID or Touch ID.')}
          </Text>
          <Flex centered width="100%">
            <PrimaryButton
              label={
                authenticationStatus === BiometricAuthenticationStatus.MissingEnrollment
                  ? t('Enable Face ID')
                  : t('Try again')
              }
              name={ElementName.TryAgain}
              width="100%"
              onPress={tryAuthenticate}
            />
            <TextButton name={ElementName.Back} onPress={cancel}>
              <Text variant="caption">{t('Cancel')}</Text>
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
