import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { openUri } from 'uniswap/src/utils/linking'
import { isWeb } from 'utilities/src/platform'

export function PasskeysHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const onPressGetHelp = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.passkeysInfo)
  }

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
          {t('passkeys.help.modal.title')}
        </Text>

        <Text color="$neutral2" textAlign="center" variant="body3">
          {t('passkeys.help.modal.subtitle')}
        </Text>

        <Flex row alignSelf="stretch" gap="$spacing12" pt="$spacing24">
          <Trace logPress element={ElementName.BackButton} modal={ModalName.PasskeysHelp}>
            <Button emphasis="secondary" onPress={onClose}>
              {t('common.button.close')}
            </Button>
          </Trace>

          <Trace logPress element={ElementName.Confirm} modal={ModalName.PasskeysHelp}>
            <Button testID={TestID.Confirm} variant="branded" emphasis="secondary" onPress={onPressGetHelp}>
              {t('common.getHelp.button')}
            </Button>
          </Trace>
        </Flex>
      </Flex>
    </Modal>
  )
}
