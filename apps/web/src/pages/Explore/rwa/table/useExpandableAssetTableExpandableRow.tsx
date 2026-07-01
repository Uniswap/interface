import type { Row } from '@tanstack/react-table'
import { useCallback } from 'react'
import { Flex } from 'ui/src'
import { ExpandableIssuerPanelContainer } from 'uniswap/src/features/expandableAsset'
import {
  EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX,
  getExpandableIssuerPanelHeightPx,
} from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { useTableRowContentMinWidthPx } from '~/components/Table/TableSizeProvider'
import type { RenderUnifiedExpandableRow } from '~/components/Table/types'
import { ExpandableTableRowContainer, IssuerTableRowHoverProvider } from '~/pages/Explore/rwa/expandable'
import type { ExpandableAssetTableRow } from '~/pages/Explore/rwa/table/expandableAssetTableRowUtils'

export function useExpandableAssetTableExpandableRow(): {
  rowWrapper: (row: Row<ExpandableAssetTableRow>, content: JSX.Element) => JSX.Element
  renderUnifiedExpandableRow: RenderUnifiedExpandableRow<ExpandableAssetTableRow>
} {
  const rowContentMinWidthPx = useTableRowContentMinWidthPx()

  const rowWrapper = useCallback((row: Row<ExpandableAssetTableRow>, content: JSX.Element) => {
    if (row.original.type === 'issuer') {
      return (
        <IssuerTableRowHoverProvider
          alignColumnsWithParentRow={row.depth > 0}
          hoverStyle={{ backgroundColor: '$surface1Hovered' }}
          onPress={(event) => {
            event.stopPropagation()
          }}
        >
          {content}
        </IssuerTableRowHoverProvider>
      )
    }

    // Match the expandable shell's vertical padding so flat rows occupy the same 72px slot
    // as collapsed expandable rows (consistent row rhythm across Stocks/ETFs/Commodities).
    return (
      <Flex group py={EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX} width="100%">
        {content}
      </Flex>
    )
  }, [])

  const renderUnifiedExpandableRow = useCallback<RenderUnifiedExpandableRow<ExpandableAssetTableRow>>(
    (row, { renderTableRow, renderSubTableRows, isExpanded }) => {
      if (row.original.type !== 'parent' || row.subRows.length === 0) {
        return renderTableRow()
      }

      return (
        <ExpandableTableRowContainer
          isExpanded={isExpanded}
          collapsedIssuerHeightPx={0}
          expandedIssuerHeightPx={getExpandableIssuerPanelHeightPx({ issuerCount: row.subRows.length })}
          rowContentMinWidthPx={rowContentMinWidthPx}
          onToggle={() => row.toggleExpanded()}
          parentRow={renderTableRow()}
          issuerPanel={<ExpandableIssuerPanelContainer>{renderSubTableRows()}</ExpandableIssuerPanelContainer>}
        />
      )
    },
    [rowContentMinWidthPx],
  )

  return { rowWrapper, renderUnifiedExpandableRow }
}
