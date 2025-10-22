import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { openUri } from 'uniswap/src/utils/linking'
import { isWebPlatform } from 'utilities/src/platform'

export enum PasskeysHelpModalTypes {
  Default = 'default',
  InvalidPasskey = 'invalidPasskey',
  TechnicalError = 'technicalIssue',
}

interface PasskeyModalContent {
  title: (t: TFunction) => string
  subtitle: (t: TFunction) => string
  icon: JSX.Element
}

const passkeysHelpModalContent: Record<PasskeysHelpModalTypes, PasskeyModalContent> = {
  [PasskeysHelpModalTypes.Default]: {
    title: (t: TFunction) => t('passkeys.help.modal.title'),
    subtitle: (t: TFunction) => t('passkeys.help.modal.subtitle'),
    icon: (
      <Flex centered borderRadius="$rounded12" p="$spacing12" backgroundColor="$surface3">
        <Passkey color="$neutral1" size="$icon.24" />
      </Flex>
    ),
  },
  [PasskeysHelpModalTypes.InvalidPasskey]: {
    title: (t: TFunction) => t('passkeys.help.modal.title.invalidPasskey'),
    subtitle: (t: TFunction) => t('passkeys.help.modal.subtitle.invalidPasskey'),
    icon: (
      <Flex centered borderRadius="$rounded12" p="$spacing12" backgroundColor="$redLight">
        <AlertTriangleFilled color="$statusCritical" size="$icon.24" />
      </Flex>
    ),
  },
  [PasskeysHelpModalTypes.TechnicalError]: {
    title: (t: TFunction) => t('passkeys.help.modal.title.technicalError'),
    subtitle: (t: TFunction) => t('passkeys.help.modal.subtitle.technicalError'),
    icon: (
      <Flex centered borderRadius="$rounded12" p="$spacing12" backgroundColor="$redLight">
        <AlertTriangleFilled color="$statusCritical" size="$icon.24" />
      </Flex>
    ),
  },
}

export function PasskeysHelpModal({
  isOpen,
  onClose,
  type = PasskeysHelpModalTypes.Default,
  accountName,
}: {
  isOpen: boolean
  onClose: () => void
  type?: PasskeysHelpModalTypes
  accountName?: string
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const onPressGetHelp = async (): Promise<void> => {
    await openUri({ uri: uniswapUrls.helpArticleUrls.passkeysInfo })
  }
  const displayName = accountName ?? t('common.thisAccount')
  const modalContent = passkeysHelpModalContent[type]
  const title = modalContent.title(t)
  const subtitle = modalContent.subtitle(t)
  const icon = modalContent.icon

  return (
    <Modal
      backgroundColor={colors.surface1.val}
      isDismissible={true}
      isModalOpen={isOpen}
      name={ModalName.PasskeysHelp}
      onClose={onClose}
    >
      <Flex
        centered
        gap="$spacing12"
        pb={isWebPlatform ? '$none' : '$spacing12'}
        pt="$spacing12"
        px={isWebPlatform ? '$none' : '$spacing24'}
      >
        {icon}

        <Text textAlign="center" variant="subheading1">
          {title}
        </Text>

        <Text color="$neutral2" textAlign="center" variant="subheading2">
          {subtitle}
          {type === PasskeysHelpModalTypes.InvalidPasskey && (
            <Text
              color={accountName ? '$neutral1' : '$neutral2'}
              textAlign="center"
              variant="subheading2"
              display="inline-flex"
            >
              {displayName}.
            </Text>
          )}
        </Text>

        <Flex row alignSelf="stretch" gap="$spacing12" pt="$spacing24">
          <Trace logPress element={ElementName.Confirm} modal={ModalName.PasskeysHelp}>
            <Button testID={TestID.Confirm} emphasis="secondary" onPress={onPressGetHelp}>
              <Text variant="buttonLabel2">{t('common.getHelp.button')}</Text>
            </Button>
          </Trace>
          <Trace logPress element={ElementName.BackButton} modal={ModalName.PasskeysHelp}>
            <Button emphasis="primary" onPress={onClose}>
              <Text variant="buttonLabel2" color="$surface1">
                {t('common.button.close')}
              </Text>
            </Button>
          </Trace>
        </Flex>
      </Flex>
    </Modal>
  )
}
