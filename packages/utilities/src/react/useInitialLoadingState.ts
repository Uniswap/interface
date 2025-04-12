import { useRef } from 'react'

/**
 * Indicates whether the component is currently in its initial loading state.
 * Once the component has completed its first loading cycle, this value will be set to false.
 * This functionality is useful for displaying a full-screen loading indicator during the initial render.
 *
 * @param isLoadingState - The loading state of the component.
 * @returns true if the component is in the initial loading state.
 */
export function useInitialLoadingState(isLoadingState: boolean): boolean {
  const isInitialLoad = useRef(isLoadingState)
  if (isInitialLoad.current && !isLoadingState) {
    isInitialLoad.current = false
  }
  return isInitialLoad.current
}
