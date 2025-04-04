import { type ScopeContext } from '@sentry/types'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LoggerErrorContext = Omit<Partial<ScopeContext>, 'tags'> & {
  tags: { file: string; function: string; errorBoundaryName?: string; chainId?: number }
}
export interface OverridesSentryFingerprint {
  /** ref: https://docs.sentry.io/platforms/javascript/guides/react/enriching-events/fingerprinting/ */
  getFingerprint(): string[]
}
