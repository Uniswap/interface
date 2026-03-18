/**
 * On native platforms, keyboard visibility is handled differently through React Native's Keyboard API.
 * This hook is a no-op that always returns false.
 * Use React Native's Keyboard.addListener for native keyboard events instead.
 */
export const useIsKeyboardOpen = (_minKeyboardHeight?: number): boolean => {
  return false
}
