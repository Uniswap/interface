import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Action } from 'redux'
import { closeModal } from 'src/features/modals/modalSlice'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openURL } from 'uniswap/src/utils/link'
import { logger } from 'utilities/src/logger/logger'

export function HiddenTokenInfoModal(): JSX.Element {
  const dispatch = useDispatch()
  const color = useSporeColors()
  const { t } = useTranslation()

  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.HiddenTokenInfoModal }))
  }

  const openUniswapURL = async (): Promise<void> => {
    try {
      await openURL(uniswapUrls.helpArticleUrls.hiddenTokenInfo)
    } catch (error) {
      logger.error(error, { tags: { file: 'HiddenToeknInfoModal.tsx', function: 'openUniswapURL' } })
    }
  }

  return (
    <Modal
      backgroundColor={color.surface1.val}
      name={ModalName.HiddenTokenInfoModal}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.HiddenTokenInfoModal }))}
    >
      <Flex gap="$spacing8" mx="$spacing24">
        <Flex centered p="$spacing12">
          <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$gap12">
            <ShieldCheck color="$neutral1" size={iconSizes.icon24} />
          </Flex>
        </Flex>
        <Flex centered gap="$spacing8" p="$spacing8">
          <Text variant="subheading1">{t('hidden.tokens.info.text.title')}</Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('hidden.tokens.info.text.info')}
          </Text>
        </Flex>
        <Button color="$neutral1" mt="$spacing12" theme="secondary" onPress={onClose}>
          {t('common.button.close')}
        </Button>
        <Button
          alignSelf="center"
          backgroundColor={undefined}
          borderRadius="$rounded12"
          color="$neutral2"
          px="$spacing40"
          theme="secondary"
          onPress={openUniswapURL}
        >
          {t('common.button.learn')}
        </Button>
      </Flex>
    </Modal>
  )
}
