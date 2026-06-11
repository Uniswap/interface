import { Row, RowData } from '@tanstack/react-table'
import { memo } from 'react'
import { Flex } from 'ui/src'
import type { RenderUnifiedExpandableRow } from '~/components/Table/types'

export type TableTopLevelRowProps<T extends RowData> = {
  row: Row<T>
  isExpanded: boolean
  rowGap: string | undefined
  renderTableRow: (row: Row<T>) => JSX.Element
  renderSubRows: (row: Row<T>, rowGap: string | undefined) => JSX.Element | null
  topLevelRowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  renderUnifiedExpandableRow?: RenderUnifiedExpandableRow<T>
}

function TableTopLevelRowInner<T extends RowData>({
  row,
  isExpanded,
  rowGap,
  renderTableRow,
  renderSubRows,
  topLevelRowWrapper,
  renderUnifiedExpandableRow,
}: TableTopLevelRowProps<T>): JSX.Element {
  if (row.subRows.length === 0 && !topLevelRowWrapper) {
    return renderTableRow(row)
  }

  if (renderUnifiedExpandableRow && row.subRows.length > 0) {
    return renderUnifiedExpandableRow(row, {
      renderTableRow: () => renderTableRow(row),
      renderSubTableRows: () => (
        <>
          {row.subRows.map((subRow) => (
            <Flex key={subRow.id} minWidth="100%" width="fit-content">
              {renderTableRow(subRow)}
            </Flex>
          ))}
        </>
      ),
      isExpanded,
    })
  }

  const content = (
    <>
      {renderTableRow(row)}
      {renderSubRows(row, rowGap)}
    </>
  )

  return topLevelRowWrapper ? topLevelRowWrapper(row, content) : content
}

function tableTopLevelRowPropsAreEqual<T extends RowData>(
  prev: TableTopLevelRowProps<T>,
  next: TableTopLevelRowProps<T>,
): boolean {
  return (
    prev.row.id === next.row.id &&
    prev.row.original === next.row.original &&
    prev.isExpanded === next.isExpanded &&
    prev.row.subRows.length === next.row.subRows.length &&
    prev.row.subRows.every((prevSubRow, index) => prevSubRow.original === next.row.subRows[index]?.original) &&
    prev.rowGap === next.rowGap &&
    prev.renderTableRow === next.renderTableRow &&
    prev.renderSubRows === next.renderSubRows &&
    prev.topLevelRowWrapper === next.topLevelRowWrapper &&
    prev.renderUnifiedExpandableRow === next.renderUnifiedExpandableRow
  )
}

export const TableTopLevelRow = memo(
  TableTopLevelRowInner,
  tableTopLevelRowPropsAreEqual,
) as typeof TableTopLevelRowInner
