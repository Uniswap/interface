import { noop } from 'utilities/src/react/noop'

// To allow usage of `dismissNativeKeyboard` in shared code without repeated conditional logic everywhere it is used, we noop rather than err in this web implementation.
// On mobile web, the keyboard is dismissed by the browser itself, so implementation isn't necessary.
export const dismissNativeKeyboard = noop

// Passes through the callback without any delay.
export function closeKeyboardBeforeCallback(callback: () => void): void {
  callback()
}
