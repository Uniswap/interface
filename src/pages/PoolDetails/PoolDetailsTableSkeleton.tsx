import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { ArrowDown } from 'react-feather'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { DetailBubble, SmallDetailBubble } from './shared'

const Table = styled(Column)`
  gap: 24px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  padding-bottom: 12px;
  overflow-y: hidden;
  ${ScrollBarStyles}
`

const TableRow = styled(Row)<{ $borderBottom?: boolean }>`
  justify-content: space-between;
  border-bottom: ${({ $borderBottom, theme }) => ($borderBottom ? `1px solid ${theme.surface3}` : 'none')}};
  padding: 12px;
  min-width: max-content;
`

const TableElement = styled(ThemedText.BodySecondary)<{
  alignRight?: boolean
  small?: boolean
  large?: boolean
}>`
  display: flex;
  padding: 0px 8px;
  flex: ${({ small }) => (small ? 'unset' : '1')};
  width: ${({ small }) => (small ? '44px' : 'auto')};
  min-width: ${({ large, small }) => (large ? '136px' : small ? 'unset' : '121px')} !important;
  justify-content: ${({ alignRight }) => (alignRight ? 'flex-end' : 'flex-start')};
`
{
  /* TODO(WEB-2735): When making real datatable, merge in this code and deprecate this skeleton file */
}
export function PoolDetailsTableSkeleton() {
  return (
    <Table $isHorizontalScroll>
      <TableRow $borderBottom>
        <TableElement large>
          <Row>
            <ArrowDown size={16} />
            <Trans>Time</Trans>
          </Row>
        </TableElement>
        <TableElement>
          <Trans>Type</Trans>
        </TableElement>
        <TableElement alignRight>
          <Trans>USD</Trans>
        </TableElement>
        <TableElement alignRight>
          <DetailBubble />
        </TableElement>
        <TableElement alignRight>
          <DetailBubble />
        </TableElement>
        <TableElement alignRight>
          <Trans>Maker</Trans>
        </TableElement>
        <TableElement alignRight small>
          <Trans>Txn</Trans>
        </TableElement>
      </TableRow>
      {Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={`loading-table-row-${i}`}>
          <TableElement large>
            <DetailBubble />
          </TableElement>
          <TableElement>
            <DetailBubble />
          </TableElement>
          <TableElement alignRight>
            <DetailBubble />
          </TableElement>
          <TableElement alignRight>
            <DetailBubble />
          </TableElement>
          <TableElement alignRight>
            <DetailBubble />
          </TableElement>
          <TableElement alignRight>
            <DetailBubble />
          </TableElement>
          <TableElement alignRight small>
            <SmallDetailBubble />
          </TableElement>
        </TableRow>
      ))}
    </Table>
  )
}
