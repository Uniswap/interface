import { Trans, useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import ExternalLinkIcon from 'ui/src/assets/icons/external-link.svg'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { isWeb } from 'utilities/src/platform'

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
    await openUri(passkeyManagementUrl.toString() + (address ? `/${address}` : ''))
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
        gap="$spacing12"
        pb={isWeb ? '$none' : '$spacing12'}
        pt="$spacing12"
        px={isWeb ? '$none' : '$spacing24'}
      >
        <Flex
          centered
          borderRadius="$rounded12"
          mb="$spacing8"
          p="$spacing12"
          style={{
            backgroundColor: colors.surface2.get(),
          }}
        >
          <Passkey color="$neutral1" size="$icon.24" />
        </Flex>

        <Text textAlign="center" variant="subheading1">
          {t('passkeys.manage.modal.title')}
        </Text>

        <Text color="$neutral2" textAlign="center" variant="body3">
          <Trans
            components={{
              highlightLink: <Text color="$accent1" variant="body3" onPress={launchPasskeyManagement} />,
            }}
            i18nKey="passkeys.manage.modal.subtitle"
            values={{
              passkeyManagementUrl: passkeyManagementUrl.hostname + passkeyManagementUrl.pathname,
            }}
          />
        </Text>

        <Flex row pt="$spacing24">
          <Trace logPress element={ElementName.Continue} modal={ModalName.PasskeyManagement}>
            <Button
              fill
              icon={<ExternalLinkIcon color={colors.neutral1.get()} height="$icon.20" width="$icon.20" />}
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
