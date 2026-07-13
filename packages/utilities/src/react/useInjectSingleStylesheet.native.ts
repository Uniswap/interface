import type { InjectSingleStylesheetParams } from 'utilities/src/react/useInjectSingleStylesheet'

/** No-op on native — stylesheet injection is web-only. */
export function useInjectSingleStylesheet(_params: InjectSingleStylesheetParams): void {}
