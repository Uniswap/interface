import { SeverityLevel } from '@sentry/types'
import { NotImplementedError } from 'wallet/src/utils/errors'

/** Dummy Sentry logging class. Overriden by mobile or extension related code. */
export interface ISentry {
  captureException(context: string, error: unknown, ...extraArgs: unknown[]): void
  captureMessage(
    level: SeverityLevel,
    context: string,
    message: string,
    ...extraArgs: unknown[]
  ): void
}

/** This will be overriden by the compiler with platform-specific Sentry file. */
export const Sentry: ISentry = {
  captureException: () => {
    throw new NotImplementedError('Sentry not implemented')
  },
  captureMessage: () => {
    throw new NotImplementedError('Sentry not implemented')
  },
}
