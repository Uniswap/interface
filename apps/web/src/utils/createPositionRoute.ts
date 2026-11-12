import { ADD_LIQUIDITY_PATH } from '~/utils/params/poolLinkParams'

/** Builds the create-position route — the generic "new position" CTA, which opens the pool browser. */
export function buildCreatePositionHref({ entryPoint }: { entryPoint?: string } = {}): string {
  const search = entryPoint ? new URLSearchParams({ entryPoint }).toString() : ''
  return search ? `${ADD_LIQUIDITY_PATH}?${search}` : ADD_LIQUIDITY_PATH
}
