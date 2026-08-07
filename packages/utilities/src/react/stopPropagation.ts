interface PropagatingEvent {
  stopPropagation: () => void
}

/** Event handler that only stops the event from bubbling to ancestor handlers. */
export function stopPropagation(e: PropagatingEvent): void {
  e.stopPropagation()
}

/**
 * Spread onto a pressable nested inside another pressable (row link, sortable header, etc.) so its
 * presses never trigger the ancestor. Override `onPress` after the spread when the element has its
 * own action — the handler must then call `e.stopPropagation()` itself.
 */
export const stopPropagationPressProps = {
  onPressIn: stopPropagation,
  onPressOut: stopPropagation,
  onPress: stopPropagation,
} as const
