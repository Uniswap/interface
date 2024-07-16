import { ReactNode } from 'react'
import { Anchor, Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons'
import { zIndices } from 'ui/src/theme'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export interface BottomModalProps {
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
  buttonTheme,
  onButtonPress,
  linkText,
  linkUrl,
}: React.PropsWithChildren<BottomModalProps>): JSX.Element {
  const colors = useSporeColors()

  return (
    <BottomSheetModal
      alignment="bottom"
      backgroundColor={colors.surface1.val}
      isModalOpen={isOpen}
      name={name}
      onClose={onDismiss}
    >
      {showCloseButton && (
        <TouchableArea
          p="$spacing16"
          position="absolute"
          right={0}
          top={0}
          zIndex={zIndices.default}
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
        <Button size="medium" theme={buttonTheme} width="100%" onPress={onButtonPress}>
          {buttonText}
        </Button>
        {linkText && linkUrl && (
          <Anchor href={linkUrl} lineHeight={16} p="$spacing12" target="_blank" textDecorationLine="none">
            <Text color="$neutral2" textAlign="center" variant="buttonLabel4">
              {linkText}
            </Text>
          </Anchor>
        )}
      </Flex>
    </BottomSheetModal>
  )
}
