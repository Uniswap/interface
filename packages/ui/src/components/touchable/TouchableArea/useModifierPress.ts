import { isWebPlatform } from '@universe/environment'
import type { ModifierPressProps, TouchableAreaEvent } from 'ui/src/components/touchable/TouchableArea/types'
import { useEvent } from 'utilities/src/react/hooks'

// Checks DOM and RN events
export function isModifierClick(event: TouchableAreaEvent): boolean {
  const e = event as unknown as Record<string, unknown>
  const ne = (e['nativeEvent'] ?? e) as Record<string, unknown>
  const metaKey = Boolean(e['metaKey'] ?? ne['metaKey'])
  const ctrlKey = Boolean(e['ctrlKey'] ?? ne['ctrlKey'])
  const shiftKey = Boolean(e['shiftKey'] ?? ne['shiftKey'])
  const button = (e['button'] as number | undefined) ?? (ne['button'] as number | undefined) ?? 0
  return metaKey || ctrlKey || shiftKey || button !== 0
}

type UseModifierPressProps = ModifierPressProps & {
  onPress?: (event: TouchableAreaEvent) => void
}

/**
 * Web only: When `href` is provided, returns props that render the element as an `<a>`
 *  - Normal click with `onPress`: `preventDefault` (suppress native navigation) then call `onPress`.
 *  - Normal click without `onPress`: allow native navigation without `preventDefault`.
 *  - Modifier click: call `onModifierPress` for side-effects only, then return without `preventDefault`
 * On native, or when no `modifierPressHref` is provided, returns `{}`
 */
export function useModifierPress({
  modifierPressHref,
  onPress,
  onModifierPress,
}: UseModifierPressProps): Record<string, unknown> {
  const handleModifierPress = useEvent((event: TouchableAreaEvent): void => {
    if (isModifierClick(event)) {
      onModifierPress?.(event)
      return
    }

    if (!onPress) {
      return
    }

    if (typeof event.preventDefault === 'function') {
      event.preventDefault()
    }
    onPress(event)
  })

  if (!isWebPlatform || !modifierPressHref) {
    return {}
  }

  return {
    tag: 'a',
    role: 'link',
    href: modifierPressHref,
    color: 'inherit',
    '$platform-web': {
      textDecorationLine: 'none',
      textDecoration: 'none',
    },
    onPress: handleModifierPress,
  }
}
