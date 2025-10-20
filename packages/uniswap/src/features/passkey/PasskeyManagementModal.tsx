import { Trans, useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { openUri } from 'uniswap/src/utils/linking'
import { isWebPlatform } from 'utilities/src/platform'

type PasskeyManagementModalProps = {
  isOpen: boolean
  onClose: () => void
  address?: Address
}

export type PasskeyManagementModalState = Omit<PasskeyManagementModalProps, 'onClose' | 'isOpen'>

export function PasskeyManagementModal({ isOpen, onClose, address }: PasskeyManagementModalProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const passkeyManagementUrl = new URL(uniswapUrls.passkeysManagementUrl)

  const launchPasskeyManagement = async (): Promise<void> => {
    await openUri({ uri: passkeyManagementUrl.toString() + (address ? `/${address}` : '') })
    onClose()
  }

  return (
    <Modal
      backgroundColor={colors.surface1.val}
      isDismissible={true}
      isModalOpen={isOpen}
      name={ModalName.PasskeyManagement}
      onClose={onClose}
    >
      <Flex
        centered
        gap="$spacing16"
        pb={isWebPlatform ? '$none' : '$spacing24'}
        pt={isWebPlatform ? '$spacing20' : '$spacing12'}
        px={isWebPlatform ? '$none' : '$spacing24'}
      >
        <Flex centered borderRadius="$rounded12" p="$spacing12" backgroundColor="$surface3">
          <Passkey color="$neutral1" size="$icon.24" />
        </Flex>

        <Flex gap="$spacing8">
          <Text textAlign="center" variant="subheading1">
            {t('passkeys.manage.modal.title')}
          </Text>

          <Text color="$neutral2" textAlign="center" variant="body3">
            <Trans
              components={{
                highlightLink: <Text color="$accent1" variant="buttonLabel3" onPress={launchPasskeyManagement} />,
              }}
              i18nKey="passkeys.manage.modal.subtitle"
              values={{
                passkeyManagementUrl: passkeyManagementUrl.hostname + passkeyManagementUrl.pathname,
              }}
            />
          </Text>
        </Flex>

        <Flex row alignSelf="stretch" pt="$spacing8">
          <Trace logPress element={ElementName.Continue} modal={ModalName.PasskeyManagement}>
            <Button
              fill
              icon={<ExternalLink color="$neutral1" size="$icon.20" />}
              iconPosition="after"
              testID={ElementName.Continue}
              emphasis="secondary"
              onPress={launchPasskeyManagement}
            >
              {t('common.button.continue')}
            </Button>
          </Trace>
        </Flex>
      </Flex>
    </Modal>
  )
}
