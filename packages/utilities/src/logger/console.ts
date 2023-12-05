/* eslint-disable no-console */

const consoleError = console.error
const consoleWarn = console.warn

export const IGNORED_MESSAGES: string[] = [
  ' Warning: findNodeHandle is deprecated in StrictMode.',
  ' Warning: findHostInstance_DEPRECATED is deprecated in StrictMode',
  ' Warning: Using UNSAFE_componentWillReceiveProps in strict mode is not recommended',
  ' Warning: Using UNSAFE_componentWillMount in strict mode is not recommended',
]

export function registerConsoleOverrides(): void {
  console.error = (msg: string, ...args): void => {
    if (IGNORED_MESSAGES.some((ignoredMessage) => msg.startsWith(ignoredMessage)))
      consoleError(msg, args)
  }

  console.warn = (msg: string, ...args): void => {
    if (IGNORED_MESSAGES.some((ignoredMessage) => msg.startsWith(ignoredMessage)))
      consoleWarn(msg, args)
  }
}
