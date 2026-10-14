import type { Row, RowData } from '@tanstack/react-table'
import { Flex } from '@universe/mycelium'
import { useCallback } from 'react'
import { ExpandableIssuerPanelContainer } from 'uniswap/src/features/expandableAsset'
import {
  EXPANDABLE_ASSET_ISSUER_ROW_ALIGNMENT_INSET_X_PX,
  EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX,
  getExpandableIssuerPanelHeightPx,
} from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import type { RenderUnifiedExpandableRow } from '~/components/Table/types'
import { ExpandableTableRowContainer } from '~/pages/Explore/rwa/expandable/ExpandableTableRowContainer'
import { IssuerTableRowHoverProvider } from '~/pages/Explore/rwa/expandable/IssuerTableRowHoverProvider'

export type UnifiedExpandableTableRowConfig<TRow extends RowData> = {
  isEmbeddedSubRow: (row: TRow, depth: number) => boolean
  isExpandableParentRow: (row: TRow, subRowCount: number) => boolean
  getExpandedPanelHeightPx?: (subRowCount: number) => number
  onParentToggle?: (row: Row<TRow>, nextExpanded: boolean) => void
  wrapEmbeddedSubRow?: (row: Row<TRow>, content: JSX.Element) => JSX.Element
  /** Widen the shell by its horizontal padding (RWA Explore card-width match). Disable when table columns
   *  flex-grow, so the shell min-width stays equal to the header/flat rows and doesn't overflow on scroll. */
  extendShellBeyondRowContent?: boolean
  /** Pass the table's `collapseExpandedRowsKey` so externally-closed rows snap shut with the reorder
   *  instead of animating afterwards. */
  instantCollapseKey?: string
}

export function useUnifiedExpandableTableRow<TRow extends RowData>({
  isEmbeddedSubRow,
  isExpandableParentRow,
  getExpandedPanelHeightPx = (subRowCount) => getExpandableIssuerPanelHeightPx({ issuerCount: subRowCount }),
  onParentToggle,
  wrapEmbeddedSubRow,
  extendShellBeyondRowContent = true,
  instantCollapseKey,
}: UnifiedExpandableTableRowConfig<TRow>): {
  rowWrapper: (row: Row<TRow>, content: JSX.Element) => JSX.Element
  renderUnifiedExpandableRow: RenderUnifiedExpandableRow<TRow>
} {
  // Bleed issuer sub-rows outward by the full shell + inner-panel padding so their columns line up with the
  // parent metrics row, which bleeds to the shell edge. The inner `$surface1` panel always sits this far
  // (shell + inner padding) inside the shell edge, whether or not the shell is widened
  // (`extendShellBeyondRowContent`), so the sub-rows must cancel both insets to match the parent.
  const subRowBleedPx = EXPANDABLE_ASSET_ISSUER_ROW_ALIGNMENT_INSET_X_PX

  const rowWrapper = useCallback(
    (row: Row<TRow>, content: JSX.Element) => {
      if (isEmbeddedSubRow(row.original, row.depth)) {
        const wrapped = wrapEmbeddedSubRow ? wrapEmbeddedSubRow(row, content) : content
        return (
          <IssuerTableRowHoverProvider
            alignColumnsWithParentRow={row.depth > 0}
            alignColumnsBleedPx={subRowBleedPx}
            hoverStyle={{ backgroundColor: '$surface1Hovered' }}
            onPress={(event) => {
              event.stopPropagation()
            }}
          >
            {wrapped}
          </IssuerTableRowHoverProvider>
        )
      }

      // Match the expandable shell's vertical padding so flat rows occupy the same slot
      // as collapsed expandable rows (consistent row rhythm).
      return (
        <Flex group py={EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX} width="100%">
          {content}
        </Flex>
      )
    },
    [isEmbeddedSubRow, wrapEmbeddedSubRow, subRowBleedPx],
  )

  const renderUnifiedExpandableRow = useCallback<RenderUnifiedExpandableRow<TRow>>(
    (row, { renderTableRow, renderSubTableRows, isExpanded }) => {
      if (!isExpandableParentRow(row.original, row.subRows.length)) {
        return renderTableRow()
      }

      return (
        <ExpandableTableRowContainer
          isExpanded={isExpanded}
          collapsedIssuerHeightPx={0}
          expandedIssuerHeightPx={getExpandedPanelHeightPx(row.subRows.length)}
          extendShellBeyondRowContent={extendShellBeyondRowContent}
          instantCollapseKey={instantCollapseKey}
          onToggle={() => {
            const nextExpanded = !row.getIsExpanded()
            row.toggleExpanded()
            onParentToggle?.(row, nextExpanded)
          }}
          parentRow={renderTableRow()}
          issuerPanel={<ExpandableIssuerPanelContainer>{renderSubTableRows()}</ExpandableIssuerPanelContainer>}
        />
      )
    },
    [isExpandableParentRow, getExpandedPanelHeightPx, onParentToggle, extendShellBeyondRowContent, instantCollapseKey],
  )

  return { rowWrapper, renderUnifiedExpandableRow }
}
