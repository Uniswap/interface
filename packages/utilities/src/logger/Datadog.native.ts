import { DdLogs } from '@datadog/mobile-react-native'
import { LogLevel, LoggerErrorContext } from 'utilities/src/logger/types'

export function logErrorToDatadog(error: Error, context: LoggerErrorContext): void {
  DdLogs.error(error instanceof Error ? (error as Error).message : 'Unknown error', {
    ...context,
  }).catch(() => {})
}

export function logWarningToDatadog(
  message: string,
  {
    level: _level,
    ...options
  }: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  DdLogs.warn(message, {
    ...options,
  }).catch(() => {})
}

export function logToDatadog(
  message: string,
  {
    level: _level,
    ...options
  }: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  DdLogs.info(message, {
    ...options,
  }).catch(() => {})
}
