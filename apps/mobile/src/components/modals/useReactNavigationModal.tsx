import { MutableRefObject, useCallback, useRef } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'

/**
 * Helper hook to close a modal using react navigation. The purpose of this
 * hook is to allow us to use react-navigation while still using the common
 * modal component.
 */
export function useReactNavigationModal(): {
  onClose: () => void
  /**
   * Needed to prevent the modal from being closed twice, which can
   * happen if the modal is dismissed by pressing a close button in the
   * modal and also when it gets called when the modal closes.
   */
  preventCloseRef: MutableRefObject<boolean>
} {
  const navigation = useAppStackNavigation()

  const preventCloseRef = useRef(false)
  const onClose = useCallback(() => {
    if (preventCloseRef.current || !navigation.isFocused()) {
      return
    }
    preventCloseRef.current = true
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }, [navigation])

  return {
    onClose,
    preventCloseRef,
  }
}
