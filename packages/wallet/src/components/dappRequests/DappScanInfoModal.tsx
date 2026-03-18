import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { FileListCheck } from 'ui/src/components/icons'
import { defaultHitslop, zIndexes } from 'ui/src/theme'
import { PoweredByBlockaid } from 'uniswap/src/components/logos/PoweredByBlockaid'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'

interface DappScanInfoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
}

export function DappScanInfoModal({ isOpen, onClose, title, description }: DappScanInfoModalProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const handleLearnMore = useCallback((): void => {
    openUri({ uri: uniswapUrls.helpArticleUrls.dappProtectionInfo }).catch((e) => {
      logger.error(e, { tags: { file: 'DappScanInfoModal', function: 'handleLearnMore' } })
    })
  }, [])

  return (
    <Modal
      backgroundColor={colors.surface1.val}
      isModalOpen={isOpen}
      name={ModalName.DappScanInfo}
      zIndex={zIndexes.overlay} // This is needed to properly display it above modals in the extension
      onClose={onClose}
    >
      <Flex
        alignItems="center"
        gap="$spacing16"
        pt="$spacing16"
        px={isMobileApp ? '$spacing24' : '$none'}
        pb={isMobileApp ? '$spacing16' : '$none'}
      >
        <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" height="$spacing48" width="$spacing48">
          <FileListCheck color="$neutral1" size="$icon.24" />
        </Flex>

        <Flex alignItems="center" gap="$spacing12">
          <Text color="$neutral1" textAlign="center" variant="subheading1">
            {title}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {description}
          </Text>
          <TouchableArea
            display="flex"
            justifyContent="center"
            alignItems="center"
            hitSlop={defaultHitslop}
            onPress={handleLearnMore}
          >
            <Text color="$neutral1" textAlign="center" variant="buttonLabel3">
              {t('common.button.learn')}
            </Text>
          </TouchableArea>
        </Flex>

        <PoweredByBlockaid />

        <Flex row width="100%">
          <Button size="medium" emphasis="secondary" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
