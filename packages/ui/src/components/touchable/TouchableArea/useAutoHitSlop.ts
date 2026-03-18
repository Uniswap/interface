import { useCallback, useMemo, useState } from 'react'
import type { Insets, LayoutChangeEvent } from 'react-native'
import { isIOS } from 'utilities/src/platform'

type FrameSize = { width: number; height: number }

// Per iOS/Android guidelines
const MIN_WIDTH = isIOS ? 44 : 48
const MIN_HEIGHT = MIN_WIDTH

/**
 *
 * **Exported only for testing purposes.**
 *
 * Calculates hit slop based on the size of the element.
 *
 * @param frameSize - The size of the element.
 * @returns The hit slop insets.
 *
 */
export const getHitSlop = ({ width, height }: FrameSize): Insets | undefined => {
  const additionalWidth = width < MIN_WIDTH ? MIN_WIDTH - width : 0
  const additionalHeight = height < MIN_HEIGHT ? MIN_HEIGHT - height : 0

  if (additionalWidth === 0 && additionalHeight === 0) {
    return undefined
  }

  return {
    top: additionalHeight / 2,
    right: additionalWidth / 2,
    bottom: additionalHeight / 2,
    left: additionalWidth / 2,
  }
}

/**
 * A hook that automatically calculates and applies hit slop to touchable elements to meet minimum touch target size requirements.
 *
 * Hit slop extends the touchable area of an element without changing its visual appearance, ensuring that small
 * elements still meet accessibility guidelines for minimum touch target size.
 *
 * @remarks
 * - Follows platform-specific guidelines for minimum touch targets:
 *   - iOS: 44×44 points (per Apple's Human Interface Guidelines)
 *   - Android: 48×48 dp (per Material Design Guidelines)
 * - Only applies hit slop when necessary (when element dimensions are below minimums)
 * - Calculates hit slop evenly on all sides to maintain the element's center position
 *
 * @param onLayoutArg - Optional callback function that will be called along with the internal layout handler
 *
 * @returns A tuple containing:
 *   1. `hitSlop`: An Insets object with top, right, bottom, and left values, or undefined if no hit slop is needed
 *   2. `onLayout`: Layout event handler that must be attached to the component to measure its dimensions
 *
 * @example
 * ```tsx
 * const [hitSlop, onLayout] = useAutoHitSlop();
 *
 * return (
 *   <TouchableArea
 *     onLayout={onLayout}
 *     hitSlop={hitSlop}
 *     onPress={handlePress}
 *   >
 *     <SmallIcon size={16} />
 *   </TouchableArea>
 * );
 * ```
 */
export const useAutoHitSlop = (
  onLayoutArg?: (e: LayoutChangeEvent) => void,
): [Insets | undefined, (e: LayoutChangeEvent) => void] => {
  const [frameSize, setFrameSize] = useState<FrameSize | undefined>(undefined)

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayoutArg?.(event)

      const {
        nativeEvent: { layout },
      } = event

      // Use functional update to prevent stale state issues if onLayout changes
      setFrameSize((prevFrameSize) => {
        if (!prevFrameSize || layout.width !== prevFrameSize.width || layout.height !== prevFrameSize.height) {
          return { width: layout.width, height: layout.height }
        }
        return prevFrameSize
      })
    },
    [onLayoutArg],
  )

  const finalHitSlop = useMemo(() => {
    // Calculate only if frameSize is not undefined
    if (!frameSize) {
      return undefined
    }

    return getHitSlop(frameSize)
  }, [frameSize])

  return [finalHitSlop, onLayout] as const
}
