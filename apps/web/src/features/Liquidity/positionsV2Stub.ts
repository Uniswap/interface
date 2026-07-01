export type PositionsV2StubFeature =
  | 'sort'
  | 'group_by_pool'
  | 'stat'
  | 'chip_filter'
  | 'search'
  | 'status'
  | 'protocol'
  | 'network'
  | 'load_more'

export function warnNotImplemented(feature: PositionsV2StubFeature, detail?: string): void {
  // eslint-disable-next-line no-console
  console.warn(`[positions] ${feature}: not implemented yet — pending Aurora rewrite${detail ? ` (${detail})` : ''}`)
}
