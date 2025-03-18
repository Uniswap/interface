import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Action } from 'redux'
import { closeModal } from 'src/features/modals/modalSlice'
import { DeprecatedButton, Flex, Image, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { CEX_TRANSFER_MODAL_BG_DARK, CEX_TRANSFER_MODAL_BG_LIGHT } from 'ui/src/assets'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openURL } from 'uniswap/src/utils/link'

const BG_IMAGE_MAX_HEIGHT = 80

export function KoreaCexTransferInfoModal(): JSX.Element {
  const dispatch = useDispatch()
  const color = useSporeColors()
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  return (
    <Modal
      backgroundColor={color.surface1.val}
      name={ModalName.KoreaCexTransferInfoModal}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.KoreaCexTransferInfoModal }))}
    >
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
        <DeprecatedButton
          color="$neutral1"
          mt="$spacing8"
          theme="secondary"
          onPress={() => openURL(uniswapUrls.helpArticleUrls.cexTransferKorea)}
        >
          {t('common.button.learn')}
        </DeprecatedButton>
      </Flex>
    </Modal>
  )
}
