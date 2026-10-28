import { Flex, FlexCompatProps, spacing, Text, TouchableArea } from '@universe/mycelium'
import { useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { X } from 'ui/src/components/icons/X'
import { POPUP_MAX_WIDTH } from '~/components/Popups/constants'

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
  width?: FlexCompatProps['width']
}): JSX.Element {
  // On web the hook only ever returns a `$platform-web` boxShadow; unwrap it for the web-only compat Flex.
  const { '$platform-web': shadowStyle } = useShadowPropsMedium()
  const isToastOneLine = typeof text === 'string'

  return (
    <Flex
      row
      alignItems="center"
      // Scoped to opacity/transform (never color properties) so theme toggling doesn't animate token colors.
      transition="opacity 300ms ease-in-out, transform 300ms ease-in-out"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded12"
      borderWidth="$spacing1"
      justifyContent="space-between"
      right={0}
      ml="auto"
      boxShadow={shadowStyle?.boxShadow}
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
