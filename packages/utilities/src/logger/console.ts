// biome-ignore-all lint/suspicious/noConsole: need to use console here

const consoleError = console.error
const consoleWarn = console.warn

interface IgnoredMessageSet {
  message: string
  firstArgValues?: string[]
}

export const IGNORED_MESSAGES: IgnoredMessageSet[] = [
  {
    message: '%s is deprecated in StrictMode',
    firstArgValues: ['findNodeHandle', 'findHostInstance_DEPRECATED'],
  },
  {
    message: 'Warning: Using UNSAFE_componentWillReceiveProps in strict mode is not recommended',
  },
  {
    message: 'Warning: Using UNSAFE_componentWillMount in strict mode',
  },
  {
    message: `No native ExponentConstants module found, are you sure the expo-constants's module is linked properly?`,
  },
  {
    message: 'ScreenProfilerNotStartedError',
  },
  {
    message: '`useBottomSheetDynamicSnapPoints` will be deprecated in the next major release',
  },
]

export function registerConsoleOverrides(): void {
  console.error = (msg, ...args): void => {
    if (!isIgnoredMessage(msg, args[0])) {
      consoleError(msg, ...args)
    }
  }

  console.warn = (msg, ...args): void => {
    if (!isIgnoredMessage(msg, args[0])) {
      consoleWarn(msg, ...args)
    }
  }
}

function isIgnoredMessage(msg: unknown, arg: unknown): boolean {
  if (typeof msg !== 'string') {
    return false
  }

  return IGNORED_MESSAGES.some((ignoredMessage) => {
    const result =
      msg.includes(ignoredMessage.message) &&
      (!ignoredMessage.firstArgValues || ignoredMessage.firstArgValues.some((argVal) => argVal === arg))
    return result
  })
}
