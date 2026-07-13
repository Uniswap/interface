import { PlatformSplitStubError } from 'utilities/src/errors'

export type InjectSingleStylesheetParams = {
  id: string
  css: string
  active?: boolean
}

/**
 * Injects a stylesheet into document.head once per id. Safe to call from many component instances.
 *
 * Web-only — use from `*.web.tsx` files.
 */
export function useInjectSingleStylesheet(_params: InjectSingleStylesheetParams): void {
  throw new PlatformSplitStubError('useInjectSingleStylesheet')
}
