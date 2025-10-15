import { POPUP_MAX_WIDTH } from 'components/Popups/constants'
import { Flex, Text, TouchableArea, useShadowPropsMedium } from 'ui/src'
import { X } from 'ui/src/components/icons/X'

// Temporary Spore-ish implementation for mweb until Spore project makes toasts consistent across all platforms
export function ToastRegularSimple({
  icon,
  text,
  onDismiss,
}: {
  icon: JSX.Element
  text?: string | JSX.Element
  onDismiss?: () => void
}): JSX.Element {
  const shadowProps = useShadowPropsMedium()
  const isToastOneLine = typeof text === 'string'

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
      mx="auto"
      {...shadowProps}
      p="$spacing16"
      position="relative"
      width={POPUP_MAX_WIDTH}
      opacity={1}
      $sm={{
        maxWidth: '100%',
        mx: 'auto',
      }}
    >
      <Flex row alignItems={isToastOneLine ? 'center' : 'flex-start'} gap={12} flex={1}>
        <Flex>{icon}</Flex>
        {text ? isToastOneLine ? <Text variant="body2">{text}</Text> : text : null}
      </Flex>
      {onDismiss ? (
        <TouchableArea onPress={onDismiss} ml="$spacing8">
          <X color="$neutral2" size={16} />
        </TouchableArea>
      ) : null}
    </Flex>
  )
}
