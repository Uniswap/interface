import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Whether the row is inside the viewport of a `UniversalList` with `trackRowViewability`. `rowKey`
 * is the row's `keyExtractor` key (undefined outside a list, where rows are always visible).
 */
export function useIsRowViewable(_rowKey: string | undefined): boolean {
  throw new PlatformSplitStubError('useIsRowViewable')
}
