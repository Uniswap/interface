import { useEagerActivityNavigation } from 'src/app/navigation/hooks'
import { store } from 'src/app/store'
import { closeAllModals } from 'src/features/modals/modalSlice'

// Helpers to preload profile data, and dismiss modals and navigate
export const useNavigateToProfileTab = (
  address: string | undefined
): {
  onPressIn: () => Promise<void>
  onPress: () => void
} => {
  const { preload, navigate } = useEagerActivityNavigation()

  const onPressIn = async (): Promise<void> => {
    if (!address) {
      return
    }
    await preload(address)
  }

  const onPress = (): void => {
    if (!address) {
      return
    }
    navigate()
    store.dispatch(closeAllModals())
  }

  return {
    onPressIn,
    onPress,
  }
}
