import { type ScopeContext } from '@sentry/types'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LoggerErrorContext = Omit<Partial<ScopeContext>, 'tags'> & {
  tags: { file: string; function: string }
}
