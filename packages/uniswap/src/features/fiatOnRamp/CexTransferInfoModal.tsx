import { Flex, Text } from '@universe/mycelium'
import { CEX_TRANSFER_MODAL_BG_DARK, CEX_TRANSFER_MODAL_BG_LIGHT } from '@universe/mycelium/assets'
import { useTranslation } from 'react-i18next'
import { Button, Image, useIsDarkMode, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'

const BG_IMAGE_MAX_HEIGHT = 80
// Source PNG is 1308x320; web has no intrinsic image size, so without this the image collapses to 0 height.
const BG_IMAGE_ASPECT_RATIO = 1308 / 320

/** Shown in place of the fiat ramps where they are region-blocked; points the user at funding from an exchange. */
export function CexTransferInfoModal({
  isOpen,
  onClose,
  onPressReceive,
}: {
  isOpen: boolean
  onClose: () => void
  onPressReceive: () => void
}): JSX.Element {
  const color = useSporeColors()
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  return (
    <Modal
      backgroundColor={color.surface1.val}
      isModalOpen={isOpen}
      name={ModalName.CexTransferInfoModal}
      onClose={onClose}
    >
      <Flex gap="$spacing16" p="$spacing24">
        <Flex alignItems="center" maxHeight={BG_IMAGE_MAX_HEIGHT}>
          <Image
            maxHeight={BG_IMAGE_MAX_HEIGHT}
            resizeMethod="resize"
            source={isDarkMode ? CEX_TRANSFER_MODAL_BG_DARK : CEX_TRANSFER_MODAL_BG_LIGHT}
            style={{ aspectRatio: BG_IMAGE_ASPECT_RATIO }}
            width="100%"
          />
        </Flex>
        <Flex centered gap="$spacing8">
          <Text variant="subheading1">{t('fiatOnRamp.cexTransferModal.title')}</Text>
          <Text textAlign="center" variant="body3">
            {t('fiatOnRamp.cexTransferModal.description')}
          </Text>
        </Flex>
        <Flex row gap="$spacing12" width="100%" mt="$spacing8">
          <Button
            flex={1}
            size="large"
            emphasis="secondary"
            onPress={() => openUri({ uri: UniswapHelpUrls.articles.transferCryptoHelp })}
          >
            {t('common.button.learn')}
          </Button>
          <Button flex={1} size="large" onPress={onPressReceive}>
            {t('common.button.receive')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
