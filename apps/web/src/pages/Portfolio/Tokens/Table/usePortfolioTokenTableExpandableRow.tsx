import type { Row } from '@tanstack/react-table'
import { useCallback } from 'react'
import { TouchableArea } from 'ui/src'
import {
  EXPANDABLE_ASSET_INNER_PADDING_Y_PX,
  EXPANDABLE_ASSET_ISSUER_GAP_PX,
} from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { useUnifiedExpandableTableRow } from '~/pages/Explore/rwa/expandable/useUnifiedExpandableTableRow'
import { PORTFOLIO_MULTICHAIN_CHAIN_ROW_HEIGHT } from '~/pages/Portfolio/constants'
import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { getTokenDataForRow, type TokenTableRow } from '~/pages/Portfolio/Tokens/Table/tokenTableRowUtils'

export function usePortfolioTokenTableExpandableRow({
  onParentToggle,
  onChildRowPress,
}: {
  onParentToggle?: (row: Row<TokenTableRow>, nextExpanded: boolean) => void
  onChildRowPress: (tokenData: TokenData) => void
}): ReturnType<typeof useUnifiedExpandableTableRow<TokenTableRow>> {
  const wrapEmbeddedSubRow = useCallback(
    (row: Row<TokenTableRow>, content: JSX.Element) => (
      <TouchableArea
        pressStyle={{ scale: 1 }}
        onPress={() => {
          onChildRowPress(getTokenDataForRow(row.original))
        }}
      >
        {content}
      </TouchableArea>
    ),
    [onChildRowPress],
  )

  return useUnifiedExpandableTableRow<TokenTableRow>({
    isEmbeddedSubRow: (row) => row.type === 'child',
    isExpandableParentRow: (row, subRowCount) => row.type === 'parent' && subRowCount > 0,
    getExpandedPanelHeightPx: (subRowCount) =>
      EXPANDABLE_ASSET_INNER_PADDING_Y_PX * 2 +
      subRowCount * PORTFOLIO_MULTICHAIN_CHAIN_ROW_HEIGHT +
      (subRowCount - 1) * EXPANDABLE_ASSET_ISSUER_GAP_PX,
    onParentToggle,
    wrapEmbeddedSubRow,
    // Portfolio columns flex-grow, so the shell must not be wider than the header/flat rows.
    extendShellBeyondRowContent: false,
  })
}
