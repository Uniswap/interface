import { POPUP_MAX_WIDTH } from 'components/Popups/PopupContent'
import { Flex, Text, TouchableArea, useShadowPropsMedium } from 'ui/src'
import { X } from 'ui/src/components/icons/X'

// Temporary Spore-ish implementation for mweb until Spore project makes toasts consistent across all platforms
export function ToastRegularSimple({
  icon,
  text,
  onDismiss,
}: {
  icon: JSX.Element
  text?: string
  onDismiss?: () => void
}): JSX.Element {
  const shadowProps = useShadowPropsMedium()

  return (
    <Flex
      row
      alignItems="center"
      animation="300ms"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      justifyContent="space-between"
      left={0}
      mx={0}
      {...shadowProps}
      p="$spacing16"
      position="relative"
      width={POPUP_MAX_WIDTH}
      opacity={1}
      $sm={{ width: 'max-content', mx: 'auto' }}
    >
      <Flex row alignItems="center" gap={12}>
        {icon}
        {text ? <Text variant="body2">{text}</Text> : null}
      </Flex>
      {onDismiss ? (
        <TouchableArea onPress={onDismiss}>
          <X color="$neutral2" size={16} ml="$spacing8" />
        </TouchableArea>
      ) : null}
    </Flex>
  )
}
