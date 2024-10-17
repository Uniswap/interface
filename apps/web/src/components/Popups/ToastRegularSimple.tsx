import { Flex, Text, TouchableArea, useMedia } from 'ui/src'
import { X } from 'ui/src/components/icons/X'

const MAX_WIDTH = 348

// Temporary Spore-ish implementation for mweb until Spore project makes toasts consistent across all platforms
export function ToastRegularSimple({
  icon,
  text,
  onDismiss,
}: {
  icon: JSX.Element
  text: string
  onDismiss?: () => void
}): JSX.Element {
  const media = useMedia()

  return (
    <Flex
      row
      alignItems="center"
      animation="300ms"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      enterStyle={media.sm ? { top: -58 } : { left: MAX_WIDTH + 20 }}
      exitStyle={media.sm ? { top: -58, opacity: 0 } : { left: MAX_WIDTH + 20 }} // TODO(WEB-4712): small-screen animations defined here bc they don't work in $sm right now
      justifyContent="space-between"
      top={media.sm ? '$spacing16' : '$none'}
      left={0}
      mx={0}
      $platform-web={
        media.sm
          ? {
              position: 'fixed',
              left: '50%',
              width: 'max-content',
              transform: [{ translateX: '-50%' }] as any, // TODO(WEB-4733): Tamagui transform needs array to work but type expects string
            }
          : {}
      }
      p="$spacing16"
      position="relative"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 25 }}
      shadowOpacity={0.2}
      shadowRadius={50}
      width={MAX_WIDTH}
      opacity={1}
    >
      <Flex row alignItems="center" gap={12}>
        {icon}
        <Text variant="body2">{text}</Text>
      </Flex>
      {onDismiss ? (
        <TouchableArea onPress={onDismiss}>
          <X color="$neutral2" size={16} ml="$spacing8" />
        </TouchableArea>
      ) : null}
    </Flex>
  )
}
