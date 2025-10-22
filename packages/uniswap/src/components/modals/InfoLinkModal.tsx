import { ReactNode } from 'react'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { isWebPlatform } from 'utilities/src/platform'

interface InfoModalProps {
  name: ModalNameType
  isOpen: boolean
  showCloseButton?: boolean
  icon: ReactNode
  title: string
  description: string
  buttonText: string
  linkText?: string
  linkUrl?: string
  onDismiss?: () => void
  onButtonPress?: () => void
  onAnalyticsEvent?: () => void
  height?: ModalProps['height']
}

export function InfoLinkModal({
  name,
  isOpen,
  showCloseButton,
  icon,
  title,
  description,
  buttonText,
  linkText,
  linkUrl,
  onDismiss,
  onButtonPress,
  onAnalyticsEvent,
  height,
}: React.PropsWithChildren<InfoModalProps>): JSX.Element {
  const colors = useSporeColors()

  const openUniswapURL = async (): Promise<void> => {
    if (!linkUrl) {
      return
    }

    try {
      await openUri({ uri: linkUrl })
      onAnalyticsEvent?.()
    } catch (error) {
      logger.error(error, { tags: { file: 'InfoLinkModal.tsx', function: 'openUniswapURL' } })
    }
  }

  return (
    <Modal backgroundColor={colors.surface1.val} isModalOpen={isOpen} name={name} height={height} onClose={onDismiss}>
      {showCloseButton && (
        <TouchableArea
          p="$spacing16"
          position="absolute"
          right={0}
          top={0}
          zIndex={zIndexes.default}
          onPress={onDismiss}
        >
          {isWebPlatform && <X color="$neutral2" size="$icon.16" />}
        </TouchableArea>
      )}
      <Flex alignItems="center" gap="$spacing8" mx={isWebPlatform ? '$none' : '$spacing36'} pt="$spacing16">
        {icon}
        <Flex centered gap="$spacing8" p="$spacing16">
          <Text color="$neutral1" variant={isWebPlatform ? 'subheading2' : 'subheading1'}>
            {title}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {description}
          </Text>
        </Flex>
        <Flex row width="100%">
          <Button fill emphasis="secondary" size="large" onPress={onButtonPress}>
            {buttonText}
          </Button>
        </Flex>
        {linkText && linkUrl && (
          <Flex row width="100%">
            <Button fill emphasis="text-only" size="large" onPress={openUniswapURL}>
              {linkText}
            </Button>
          </Flex>
        )}
      </Flex>
    </Modal>
  )
}
