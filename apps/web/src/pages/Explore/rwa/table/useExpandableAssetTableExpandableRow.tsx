import { useUnifiedExpandableTableRow } from '~/pages/Explore/rwa/expandable/useUnifiedExpandableTableRow'
import type { ExpandableAssetTableRow } from '~/pages/Explore/rwa/table/expandableAssetTableRowUtils'

export function useExpandableAssetTableExpandableRow(): ReturnType<
  typeof useUnifiedExpandableTableRow<ExpandableAssetTableRow>
> {
  return useUnifiedExpandableTableRow<ExpandableAssetTableRow>({
    isEmbeddedSubRow: (row) => row.type === 'issuer',
    isExpandableParentRow: (row, subRowCount) => row.type === 'parent' && subRowCount > 0,
  })
}
