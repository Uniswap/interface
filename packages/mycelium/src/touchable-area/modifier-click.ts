import type { TouchableAreaCompatEvent } from './props'

/**
 * Checks DOM events for modifier clicks (meta/ctrl/shift or non-primary
 * button). Platform-agnostic module so the barrel export resolves identically
 * on web and Metro (the `.native.tsx` split does not implement modifier-press
 * navigation — it is a web-only escape hatch).
 */
export function isModifierClick(event: TouchableAreaCompatEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0
}
