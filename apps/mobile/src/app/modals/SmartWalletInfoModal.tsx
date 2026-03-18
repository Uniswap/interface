import React from 'react'
import { useTranslation } from 'react-i18next'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { SmartWallet } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'

const onPressLearnMore = (url: string): Promise<void> => openUri({ uri: url })

export function SmartWalletInfoModal(): JSX.Element {
  const color = useSporeColors()
  const { onClose } = useReactNavigationModal()
  const { t } = useTranslation()

  return (
    <Modal backgroundColor={color.surface1.val} name={ModalName.SmartWalletInfoModal} onClose={onClose}>
      <Flex gap="$gap24" p="$spacing24" alignItems="center">
        <Flex centered height="$spacing48" backgroundColor="$accent2" width="$spacing48" borderRadius="$rounded12">
          <SmartWallet color={color.accent1.val} size="$icon.24" />
        </Flex>
        <Flex centered gap="$gap8">
          <Text variant="subheading1">{t('smartWallet.modal.title')}</Text>
          <Text textAlign="center" variant="body3" color="$neutral2">
            {t('smartWallet.modal.description.block1')}
          </Text>
          <Text textAlign="center" variant="body3" color="$neutral2">
            {t('smartWallet.modal.description.block2')}
          </Text>
          <TouchableArea onPress={() => onPressLearnMore(uniswapUrls.helpArticleUrls.smartWalletDelegation)}>
            <Text textAlign="center" variant="buttonLabel3" color="$neutral1">
              {t('common.button.learn')}
            </Text>
          </TouchableArea>
        </Flex>
        <Flex row width="100%">
          <Button size="large" emphasis="secondary" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
