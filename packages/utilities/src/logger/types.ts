export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LoggerErrorContext = {
  tags: { file: string; function: string; errorBoundaryName?: string; chainId?: number }
  extra?: Record<string, unknown>
  level?: LogLevel
}
