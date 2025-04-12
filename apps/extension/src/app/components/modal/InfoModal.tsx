import { ReactNode } from 'react'
import { Anchor, Button, ButtonEmphasis, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons'
import { zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export interface ModalProps {
  name: ModalNameType
  isOpen: boolean
  showCloseButton?: boolean
  onDismiss?: () => void
  icon: ReactNode
  title: string
  description: string
  buttonText: string
  buttonEmphasis?: ButtonEmphasis
  onButtonPress?: () => void
  linkText?: string
  linkUrl?: string
}

export function InfoModal({
  name,
  isOpen,
  showCloseButton,
  onDismiss,
  icon,
  title,
  description,
  buttonText,
  buttonEmphasis,
  onButtonPress,
  linkText,
  linkUrl,
}: React.PropsWithChildren<ModalProps>): JSX.Element {
  const colors = useSporeColors()

  return (
    <Modal backgroundColor={colors.surface1.val} isModalOpen={isOpen} name={name} onClose={onDismiss}>
      {showCloseButton && (
        <TouchableArea
          p="$spacing16"
          position="absolute"
          right={0}
          top={0}
          zIndex={zIndexes.default}
          onPress={onDismiss}
        >
          <X color="$neutral2" size="$icon.16" />
        </TouchableArea>
      )}
      <Flex alignItems="center" gap="$spacing8" pt="$spacing16">
        {icon}
        <Flex alignItems="center" gap="$spacing8" pb="$spacing16" pt="$spacing8" px="$spacing4">
          <Text color="$neutral1" textAlign="center" variant="subheading2">
            {title}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {description}
          </Text>
        </Flex>
        <Flex row alignSelf="stretch">
          <Button size="medium" emphasis={buttonEmphasis} onPress={onButtonPress}>
            {buttonText}
          </Button>
        </Flex>
        {linkText && linkUrl && (
          <Anchor href={linkUrl} lineHeight={16} p="$spacing12" target="_blank" textDecorationLine="none">
            <Text color="$neutral2" textAlign="center" variant="buttonLabel3">
              {linkText}
            </Text>
          </Anchor>
        )}
      </Flex>
    </Modal>
  )
}
