import { useCallback, useEffect, useRef, useState } from 'react'
import { TouchableArea } from 'ui/src/components/touchable'
import { RefreshIcon } from 'ui/src/loading/RefreshIcon'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Refresh icon with 360-degree rotation animation.
 *
 * @param {() => void} onPress - Callback function to execute when the refresh button is pressed
 * @param {boolean} isLoading - Indicates whether a refresh operation is in progress
 *
 * @returns {JSX.Element} A button with refresh icon
 */
export function RefreshButtonIcon({ onPress, isLoading }: { onPress: () => void; isLoading: boolean }): JSX.Element {
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopAnimation = useCallback((): void => {
    setIsAnimating(false)
    timeoutRef.current = null
  }, [])

  const handlePress = useCallback((): void => {
    if (isLoading) {
      return
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Trigger 360-degree rotation animation
    setIsAnimating(true)
    onPress()

    // Set timeout to stop animation after one second
    timeoutRef.current = setTimeout(stopAnimation, ONE_SECOND_MS)
  }, [isLoading, onPress, stopAnimation])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return (
    <TouchableArea
      group
      animation={null}
      $group-hover={{ opacity: 1 }}
      opacity={0}
      flex={1}
      alignItems="center"
      transition="all 0.1s ease-in-out"
      justifyContent="center"
      // manually set disabled state using props, so we don't break hover state
      cursor={isLoading ? 'auto' : 'pointer'}
      disabled={isLoading}
      onPress={handlePress}
    >
      <RefreshIcon
        isAnimating={isAnimating}
        color="$neutral3"
        $group-hover={{ color: isLoading ? '$neutral3' : '$neutral3Hovered' }}
        size={16}
      />
    </TouchableArea>
  )
}
