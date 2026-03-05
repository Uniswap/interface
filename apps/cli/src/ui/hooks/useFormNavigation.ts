import { useInput } from 'ink'
import { useCallback, useState } from 'react'

interface UseFormNavigationOptions {
  itemCount: number
  onEscape?: () => void
  enabled?: boolean
  // Optional: block navigation when true (e.g., when editing a field)
  blockNavigation?: boolean
}

interface UseFormNavigationReturn {
  focusedIndex: number
  setFocusedIndex: (index: number) => void
}

/**
 * Hook for managing keyboard navigation in forms
 * Handles up/down arrow navigation only - selection logic handled by parent
 */
export function useFormNavigation({
  itemCount,
  onEscape,
  enabled = true,
  blockNavigation = false,
}: UseFormNavigationOptions): UseFormNavigationReturn {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const arrowUp = useCallback(() => {
    setFocusedIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const arrowDown = useCallback(() => {
    setFocusedIndex((prev) => Math.min(itemCount - 1, prev + 1))
  }, [itemCount])

  const handleEscape = useCallback(() => {
    if (onEscape) {
      onEscape()
    }
  }, [onEscape])

  // Register keyboard handlers - only handles navigation arrows
  useInput(
    useCallback(
      (_input: string, key: { upArrow?: boolean; downArrow?: boolean; escape?: boolean }) => {
        if (!enabled || blockNavigation) {
          return
        }

        if (key.upArrow) {
          arrowUp()
        } else if (key.downArrow) {
          arrowDown()
        } else if (key.escape && onEscape) {
          handleEscape()
        }
      },
      [enabled, blockNavigation, arrowUp, arrowDown, handleEscape, onEscape],
    ),
  )

  return {
    focusedIndex,
    setFocusedIndex,
  }
}
