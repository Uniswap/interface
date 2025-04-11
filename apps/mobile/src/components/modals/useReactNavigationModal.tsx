import { useCallback, useRef } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'

/**
 * Helper hook to close a modal using react navigation. The purpose of this
 * hook is to allow us to use react-navigation while still using the common
 * modal component.
 */
export function useReactNavigationModal(): {
  onClose: () => void
} {
  const navigation = useAppStackNavigation()

  // Needed to prevent the modal from being closed twice, which can
  // happen if the modal is dismissed by pressing a close button in the
  // modal and also when it gets called when the modal closes.
  const closeHasBeenCalledRef = useRef(false)
  const onClose = useCallback(() => {
    if (closeHasBeenCalledRef.current) {
      return
    }
    closeHasBeenCalledRef.current = true
    navigation.goBack()
  }, [navigation])

  return {
    onClose,
  }
}
