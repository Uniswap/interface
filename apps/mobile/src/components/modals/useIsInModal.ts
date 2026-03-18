import { useNavigationState } from '@react-navigation/core'

/**
 * Hook to check if the current screen is in a specific modal
 * @param modalName The modal name to check against (defaults to Explore)
 * @param checkParent If true, checks parent screen instead of current screen
 * @returns boolean indicating if the current screen is inside the specified modal
 */
export function useIsInModal(modalName: string, checkParent = false): boolean {
  return useNavigationState((state) => {
    const routeIndex = checkParent ? state.index - 1 : state.index

    if (routeIndex < 0) {
      return false
    }

    return state.routes[routeIndex]?.name === modalName
  })
}
