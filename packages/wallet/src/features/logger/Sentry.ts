import { SeverityLevel } from '@sentry/types'
import { LoggerErrorContext } from 'wallet/src/features/logger/logger'
import { NotImplementedError } from 'wallet/src/utils/errors'

/** Dummy Sentry logging class. Overridden by mobile or extension related code. */
export interface ISentry {
  captureException(errorMessage: string, captureContext: LoggerErrorContext): void
  captureMessage(
    level: SeverityLevel,
    context: string,
    message: string,
    ...extraArgs: unknown[]
  ): void
}

/** This will be overridden by the compiler with platform-specific Sentry file. */
export const Sentry: ISentry = {
  captureException: () => {
    throw new NotImplementedError('Sentry not implemented')
  },
  captureMessage: () => {
    throw new NotImplementedError('Sentry not implemented')
  },
}
