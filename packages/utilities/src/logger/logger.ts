import { datadogEnabledBuild, localDevDatadogEnabled } from 'utilities/src/environment/constants'
import { logErrorToDatadog, logToDatadog, logWarningToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { LogLevel, LoggerErrorContext } from 'utilities/src/logger/types'
import { isInterface, isMobileApp, isWeb } from 'utilities/src/platform'
// weird temp fix: the web app is complaining about __DEV__ being global
// i tried declaring it in a variety of places:
//   - in web app env.d.ts and polyfills.ts files
//   - in utilities index.ts and in a new env.d.ts file
// none of them work! but declaring it here does
// perhaps because the declarations are not applying to external packages
// but somehow its also not picking up the declarations here
declare global {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore its ok
  const __DEV__: boolean
}

const MAX_CHAR_LIMIT = 8192

let datadogEnabled = false

/**
 * Logs a message to console. Additionally sends log to Datadog if using 'error', 'warn', or 'info'.
 * Use `logger.debug` for development only logs.
 *
 * ex. `logger.warn('myFile', 'myFunc', 'Some warning', myArray)`
 *
 * @param fileName Name of file where logging from
 * @param functionName Name of function where logging from
 * @param message Message to log
 * @param args Additional values to log
 */
export const logger = {
  debug: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('debug', fileName, functionName, message, ...args),
  info: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('info', fileName, functionName, message, ...args),
  warn: (fileName: string, functionName: string, message: string, ...args: unknown[]): void =>
    logMessage('warn', fileName, functionName, message, ...args),
  error: (error: unknown, captureContext: LoggerErrorContext): void => logException(error, captureContext),
  setDatadogEnabled: (enabled: boolean): void => {
    datadogEnabled = enabled || localDevDatadogEnabled
  },
}

function logMessage(
  level: LogLevel,
  fileName: string,
  functionName: string,
  message: string,
  ...args: unknown[] // arbitrary extra data - ideally formatted as key value pairs
): void {
  // Log to console directly for dev builds or interface for debugging
  if (__DEV__ || isInterface) {
    if (isMobileApp && ['log', 'debug', 'warn'].includes(level)) {
      // `log`, `debug`, and `warn` are all logged with `console.log` on mobile
      // because `console.debug` and `console.warn` only support one single argument in Reactotron.
      // Alternatively, we could improve this in the future by removing the Reactotron log plugin and instead
      // manually call `Reactotron.display(...)` here with some custom formatting.
      // eslint-disable-next-line no-console
      console.log(...formatMessage(level, fileName, functionName, message), ...args)
    } else {
      // eslint-disable-next-line no-console
      console[level](...formatMessage(level, fileName, functionName, message), ...args)
    }
  }

  // don't log if datadog isn't enabled on the build or by the switch
  if (!datadogEnabledBuild || !datadogEnabled) {
    return
  }

  if (level === 'warn') {
    logWarningToDatadog(message, {
      level,
      args,
      functionName,
      fileName,
    })
  } else if (level === 'info') {
    logToDatadog(message, {
      level,
      args,
      functionName,
      fileName,
    })
  }
}

function logException(error: unknown, captureContext: LoggerErrorContext): void {
  const updatedContext = addErrorExtras(error, captureContext)

  // Log to console directly for dev builds or interface for debugging
  if (__DEV__ || isInterface) {
    // eslint-disable-next-line no-console
    console.error(error, captureContext)
  }

  // don't log if datadog isn't enabled on the build or by the switch
  if (!datadogEnabledBuild || !datadogEnabled) {
    return
  }

  // Limit character length for string tags
  for (const contextProp of Object.keys(updatedContext.tags)) {
    const prop = contextProp as 'file' | 'function'
    const contextValue = updatedContext.tags[prop]
    if (typeof contextValue === 'string') {
      updatedContext.tags[prop] = contextValue.slice(0, MAX_CHAR_LIMIT)
    }
  }

  logErrorToDatadog(error instanceof Error ? error : new Error(`${error}`), updatedContext)
}

interface RNError {
  nativeStackAndroid?: unknown
  userInfo?: unknown
}

// Adds extra fields from errors provided by React Native
export function addErrorExtras(error: unknown, captureContext: LoggerErrorContext): LoggerErrorContext {
  if (error instanceof Error) {
    const updatedContext = { ...captureContext }

    const extras: Record<string, unknown> = {}
    const { nativeStackAndroid, userInfo } = error as RNError

    if (Array.isArray(nativeStackAndroid) && nativeStackAndroid.length > 0) {
      extras.nativeStackAndroid = nativeStackAndroid
    }

    if (userInfo) {
      extras.userInfo = userInfo
    }

    updatedContext.extra = { ...updatedContext.extra, ...extras }

    return updatedContext
  }
  return captureContext
}

function pad(n: number, amount: number = 2): string {
  return n.toString().padStart(amount, '0')
}

function formatMessage(
  level: LogLevel,
  fileName: string,
  functionName: string,
  message: string,
): (string | Record<string, unknown>)[] {
  const t = new Date()
  const timeString = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}.${pad(t.getMilliseconds(), 3)}`
  if (isWeb) {
    // Simpler printing for web logging
    return [
      level.toUpperCase(),
      {
        context: {
          time: timeString,
          fileName,
          functionName,
        },
      },
      message,
    ]
  } else {
    // Specific printing style for mobile logging
    return [`${timeString}::${fileName}#${functionName}`, message]
  }
}
