import type { Row, RowData } from '@tanstack/react-table'
import { useCallback } from 'react'
import { Flex } from 'ui/src'
import { ExpandableIssuerPanelContainer } from 'uniswap/src/features/expandableAsset'
import {
  EXPANDABLE_ASSET_INNER_PADDING_X_PX,
  EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX,
  getExpandableIssuerPanelHeightPx,
} from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { useTableRowContentMinWidthPx } from '~/components/Table/TableSizeProvider'
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
}

export function useUnifiedExpandableTableRow<TRow extends RowData>({
  isEmbeddedSubRow,
  isExpandableParentRow,
  getExpandedPanelHeightPx = (subRowCount) => getExpandableIssuerPanelHeightPx({ issuerCount: subRowCount }),
  onParentToggle,
  wrapEmbeddedSubRow,
  extendShellBeyondRowContent = true,
}: UnifiedExpandableTableRowConfig<TRow>): {
  rowWrapper: (row: Row<TRow>, content: JSX.Element) => JSX.Element
  renderUnifiedExpandableRow: RenderUnifiedExpandableRow<TRow>
} {
  const rowContentMinWidthPx = useTableRowContentMinWidthPx()

  // RWA shells are widened by the shell padding, so sub-rows only bleed past the inner panel padding.
  // Non-widened shells (e.g. portfolio) must also bleed past the shell padding, or fixed-width sub-rows
  // overflow the shell's right edge.
  const subRowBleedPx =
    EXPANDABLE_ASSET_INNER_PADDING_X_PX + (extendShellBeyondRowContent ? 0 : EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX)

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
          rowContentMinWidthPx={rowContentMinWidthPx}
          extendShellBeyondRowContent={extendShellBeyondRowContent}
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
    [
      rowContentMinWidthPx,
      isExpandableParentRow,
      getExpandedPanelHeightPx,
      onParentToggle,
      extendShellBeyondRowContent,
    ],
  )

  return { rowWrapper, renderUnifiedExpandableRow }
}
