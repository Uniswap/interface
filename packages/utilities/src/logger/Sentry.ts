import { Primitive, SeverityLevel } from '@sentry/types'
import { PlatformSplitStubError } from 'utilities/src/errors'
import { LoggerErrorContext } from 'utilities/src/logger/types'

export type BreadCrumb = {
  message: string
  category: string
  level: SeverityLevel
  data: {
    [key: string]: string | number | boolean | undefined
  }
}

/** Dummy Sentry logging class. Overridden by mobile or extension related code. */
export interface ISentry {
  captureException(error: unknown, captureContext: LoggerErrorContext): void
  captureMessage(level: SeverityLevel, context: string, message: string, ...extraArgs: unknown[]): void
  addBreadCrumb(breadCrumb: BreadCrumb): void
  setTag(key: string, value: Primitive): void
}

/** This will be overridden by the compiler with platform-specific Sentry file. */
export const Sentry: ISentry = {
  captureException: () => {
    throw new PlatformSplitStubError('Sentry not implemented')
  },
  captureMessage: () => {
    throw new PlatformSplitStubError('Sentry not implemented')
  },
  addBreadCrumb: (_breadCrumb: BreadCrumb) => {
    throw new PlatformSplitStubError('Sentry not implemented')
  },
  setTag: (_key: string, _value: Primitive) => {
    throw new PlatformSplitStubError('Sentry not implemented')
  },
}
