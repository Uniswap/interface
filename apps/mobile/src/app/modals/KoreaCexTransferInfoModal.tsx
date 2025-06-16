import React from 'react'
import { useTranslation } from 'react-i18next'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { Button, Flex, Image, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { CEX_TRANSFER_MODAL_BG_DARK, CEX_TRANSFER_MODAL_BG_LIGHT } from 'ui/src/assets'
import { Modal } from 'nextrade/src/components/modals/Modal'
import { nextradeUrls } from 'nextrade/src/constants/urls'
import { ModalName } from 'nextrade/src/features/telemetry/constants'
import { openUri } from 'nextrade/src/utils/linking'

const BG_IMAGE_MAX_HEIGHT = 80

export function KoreaCexTransferInfoModal(): JSX.Element {
  const color = useSporeColors()
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const { onClose } = useReactNavigationModal()

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
        <Flex row width="100%" mt="$spacing8">
          <Button
            size="large"
            emphasis="secondary"
            onPress={() => openUri(nextradeUrls.helpArticleUrls.cexTransferKorea)}
          >
            {t('common.button.learn')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
