/**
 * Builds the `/pools/v2/find` route — the destination for the "Import v2 positions" flow.
 * Accepts an optional `entryPoint` so callers from Portfolio surfaces (e.g. `/portfolio/pools`)
 * can preserve their origin for downstream breadcrumb + top-nav-active state via `resolveEntryPoint`.
 */
export function buildImportV2PositionsHref({ entryPoint }: { entryPoint?: string } = {}): string {
  const path = '/pools/v2/find'
  const search = entryPoint ? new URLSearchParams({ entryPoint }).toString() : ''
  return search ? `${path}?${search}` : path
}
