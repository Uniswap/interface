import { useTranslation } from 'react-i18next'
import { Button, Flex, GeneratedIcon, Square, Text, useSporeColors } from 'ui/src'
import { HelpCenter } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

export function BiometricAuthModal({
  onClose,
  biometricMethodName,
  title,
  Icon,
}: {
  onClose: () => void
  biometricMethodName: string
  title: string
  Icon: GeneratedIcon
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const onPressGetHelp = useEvent((): void => {
    window.open(uniswapUrls.helpArticleUrls.extensionBiometricsEnrollment, '_blank')
  })

  return (
    <Modal
      alignment="center"
      backgroundColor={colors.surface1.val}
      hideHandlebar={true}
      isDismissible={true}
      name={ModalName.WaitingForBiometricsEnrollment}
      onClose={onClose}
    >
      <Flex grow alignItems="flex-end">
        <Flex row>
          <Button icon={<HelpCenter />} size="xsmall" emphasis="tertiary" onPress={onPressGetHelp}>
            {t('common.getHelp.button')}
          </Button>
        </Flex>
      </Flex>

      <Flex centered gap="$spacing12">
        <Square backgroundColor="$surface2" borderRadius="$rounded12" size="$spacing48">
          <Icon color="$neutral1" size="$icon.24" />
        </Square>

        <Flex centered gap="$spacing8">
          <Text textAlign="center" variant="subheading2">
            {title}
          </Text>

          <Text textAlign="center" variant="body3" color="$neutral2">
            {t('settings.setting.biometrics.extension.waitingForBiometricsModal.content', {
              biometricsMethod: biometricMethodName,
            })}
          </Text>
        </Flex>

        <Flex row width="100%" gap="$spacing12" mt="$spacing12">
          <Button size="medium" emphasis="secondary" onPress={onClose}>
            {t('common.button.cancel')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
