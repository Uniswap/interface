import { POPUP_MAX_WIDTH } from 'components/Popups/constants'
import { Flex, FlexProps, Text, TouchableArea, useShadowPropsMedium } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { spacing } from 'ui/src/theme'

// Temporary Spore-ish implementation for mweb until Spore project makes toasts consistent across all platforms
export function ToastRegularSimple({
  icon,
  text,
  onDismiss,
  width,
}: {
  icon?: JSX.Element
  text?: string | JSX.Element
  onDismiss?: () => void
  width?: FlexProps['width']
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
      borderRadius="$rounded12"
      borderWidth="$spacing1"
      justifyContent="space-between"
      right={0}
      ml="auto"
      {...shadowProps}
      p="$spacing12"
      position="relative"
      width={width ?? POPUP_MAX_WIDTH}
      opacity={1}
      $sm={{
        maxWidth: '100%',
        mx: 'auto',
      }}
    >
      <Flex row alignItems={isToastOneLine ? 'center' : 'flex-start'} gap={spacing.spacing6} flex={1}>
        {icon && <Flex>{icon}</Flex>}
        {text ? isToastOneLine ? <Text variant="body3">{text}</Text> : text : null}
      </Flex>
      {onDismiss ? (
        <TouchableArea onPress={onDismiss} ml="$spacing8">
          <X color="$neutral2" size="$icon.16" />
        </TouchableArea>
      ) : null}
    </Flex>
  )
}
