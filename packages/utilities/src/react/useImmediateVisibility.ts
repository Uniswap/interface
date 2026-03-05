import { useEffect, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Manages visibility state with immediate UI response to user actions.
 *
 * Useful for triggering exit animations instantly before business logic state updates,
 * eliminating perceived delay in React's rendering cycle.
 *
 * @param shouldShow - Boolean controlling whether the element should be visible
 * @param onAction - Callback to execute after hiding (e.g., state updates)
 * @returns Object with visibility state and action handler
 *
 * @example
 * ```tsx
 * const { isVisible, handleAction } = useImmediateVisibility(
 *   shouldShowButtons,
 *   (value) => updateFormState(value)
 * )
 *
 * // In AnimatePresence
 * {shouldShowButtons && isVisible && (
 *   <AnimatedComponent exitStyle={...} />
 * )}
 *
 * // In button
 * <Button onPress={() => handleAction(someValue)} />
 * ```
 */
export function useImmediateVisibility<T extends unknown[]>({
  shouldShow,
  onAction,
}: {
  shouldShow: boolean
  onAction: (...args: T) => void
}): { isVisible: boolean; handleAction: (...args: T) => void } {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (shouldShow) {
      setIsVisible(true)
    }
  }, [shouldShow])

  const handleAction = useEvent((...args: T) => {
    setIsVisible(false)
    onAction(...args)
  })

  return { isVisible: isVisible && shouldShow, handleAction }
}
