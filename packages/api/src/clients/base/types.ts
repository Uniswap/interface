import type { SessionService } from '@universe/sessions'

export type StandardFetchOptions = Parameters<typeof fetch>[1]

export type CustomOptions = StandardFetchOptions & {
  params?: Record<string, string | number | boolean | undefined | null>
  on404?: () => void
}

export interface FetchClientContext {
  baseUrl: string
  getHeaders?: () => HeadersInit
  getSessionService: () => SessionService
  defaultOptions?: Omit<StandardFetchOptions, 'headers'>
}

export interface FetchClient {
  readonly context: () => FetchClientContext
  readonly fetch: <T = Response>(path: string, options: StandardFetchOptions) => Promise<T>
  readonly get: <T>(path: string, options?: CustomOptions) => Promise<T>
  readonly post: <T>(path: string, options: CustomOptions) => Promise<T>
  readonly put: <T>(path: string, options: CustomOptions) => Promise<T>
  readonly delete: <T>(path: string, options: CustomOptions) => Promise<T>
  readonly patch: <T>(path: string, options: CustomOptions) => Promise<T>
}
