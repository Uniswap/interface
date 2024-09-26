import { ReactNode } from 'react'
import { Button, Flex, isWeb, Text, TouchableArea, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons'
import { zIndices } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { openURL } from 'uniswap/src/utils/link'
import { logger } from 'utilities/src/logger/logger'

export interface ModalProps {
  name: ModalNameType
  isOpen: boolean
  showCloseButton?: boolean
  onDismiss?: () => void
  icon: ReactNode
  title: string
  description: string
  buttonText: string
  buttonTheme?: 'primary' | 'secondary' | 'tertiary'
  onButtonPress?: () => void
  linkText?: string
  linkUrl?: string
  onAnalyticsEvent?: () => void
}

export function InfoLinkModal({
  name,
  isOpen,
  showCloseButton,
  onDismiss,
  icon,
  title,
  description,
  buttonText,
  buttonTheme,
  onButtonPress,
  linkText,
  linkUrl,
  onAnalyticsEvent,
}: React.PropsWithChildren<ModalProps>): JSX.Element {
  const colors = useSporeColors()

  const openUniswapURL = async (): Promise<void> => {
    if (!linkUrl) {
      return
    }

    try {
      await openURL(linkUrl)
      onAnalyticsEvent?.()
    } catch (error) {
      logger.error(error, { tags: { file: 'InfoLinkModal.tsx', function: 'openUniswapURL' } })
    }
  }

  return (
    <Modal backgroundColor={colors.surface1.val} isModalOpen={isOpen} name={name} onClose={onDismiss}>
      {showCloseButton && (
        <TouchableArea
          p="$spacing16"
          position="absolute"
          right={0}
          top={0}
          zIndex={zIndices.default}
          onPress={onDismiss}
        >
          {isWeb && <X color="$neutral2" size="$icon.16" />}
        </TouchableArea>
      )}
      <Flex alignItems="center" gap="$spacing8" mx={isWeb ? '$none' : '$spacing36'} pt="$spacing16">
        {icon}
        <Flex centered gap="$spacing8" p="$spacing16">
          <Text color="$neutral1" variant={isWeb ? 'subheading2' : 'subheading1'}>
            {title}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {description}
          </Text>
        </Flex>
        <Button theme={buttonTheme} width="100%" onPress={onButtonPress}>
          {buttonText}
        </Button>
        {linkText && linkUrl && (
          <Button
            alignSelf="center"
            backgroundColor="transparent"
            borderRadius="$rounded12"
            color="$neutral2"
            px="$spacing40"
            theme="secondary"
            onPress={openUniswapURL}
          >
            {linkText}
          </Button>
        )}
      </Flex>
    </Modal>
  )
}
