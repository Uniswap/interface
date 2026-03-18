import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { Button, Flex, Image, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { CEX_TRANSFER_MODAL_BG_DARK, CEX_TRANSFER_MODAL_BG_LIGHT } from 'ui/src/assets'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'

const BG_IMAGE_MAX_HEIGHT = 80

export function KoreaCexTransferInfoModal(): JSX.Element {
  const color = useSporeColors()
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const { onClose } = useReactNavigationModal()
  const openReceiveModal = useOpenReceiveModal()

  const onPressReceive = useCallback(() => {
    onClose()
    openReceiveModal()
  }, [onClose, openReceiveModal])

  return (
    <Modal backgroundColor={color.surface1.val} name={ModalName.KoreaCexTransferInfoModal} onClose={onClose}>
      <Flex gap="$spacing16" p="$spacing24">
        <Flex alignItems="center" maxHeight={BG_IMAGE_MAX_HEIGHT}>
          <Image
            maxHeight={BG_IMAGE_MAX_HEIGHT}
            resizeMethod="resize"
            source={isDarkMode ? CEX_TRANSFER_MODAL_BG_DARK : CEX_TRANSFER_MODAL_BG_LIGHT}
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
            onPress={() => openUri({ uri: uniswapUrls.helpArticleUrls.cexTransferKorea })}
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
