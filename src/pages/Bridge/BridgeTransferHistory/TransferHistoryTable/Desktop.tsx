import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import ActionCell from 'pages/Bridge/BridgeTransferHistory/ActionCell'
import RouteCell from 'pages/Bridge/BridgeTransferHistory/RouteCell'
import StatusBadge from 'pages/Bridge/BridgeTransferHistory/StatusBadge'
import TimeCell from 'pages/Bridge/BridgeTransferHistory/TimeCell'
import TokenReceiveCell from 'pages/Bridge/BridgeTransferHistory/TokenReceiveCell'
import { ITEMS_PER_PAGE } from 'pages/Bridge/consts'

import { Props } from './index'

const commonCSS = css`
  width: 100%;
  padding: 0 16px;

  display: grid;
  grid-template-columns: 112px 100px 80px 150px 48px;
  justify-content: space-between;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    column-gap: 4px;
    grid-template-columns: 112px 100px 64px minmax(auto, 130px) 48px;
  `}
`

const TableHeader = styled.div`
  ${commonCSS}
  height: 48px;
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 20px 20px 0 0;
`

const TableColumnText = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
`

const TableRow = styled.div`
  ${commonCSS}
  height: 60px;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  &:last-child {
    border-bottom: none;
  }
`

const Desktop: React.FC<Props> = ({ transfers }) => {
  const renderInvisibleRows = () => {
    // don't need invisible rows for upToExtraSmall screens
    if (transfers.length === ITEMS_PER_PAGE) {
      return null
    }

    return Array(ITEMS_PER_PAGE - transfers.length)
      .fill(0)
      .map((_, i) => {
        return (
          <TableRow
            key={i}
            style={{
              visibility: 'hidden',
            }}
          />
        )
      })
  }

  return (
    <Flex flexDirection="column" style={{ flex: 1 }}>
      <TableHeader>
        <TableColumnText>
          <Trans>CREATED</Trans>
        </TableColumnText>
        <TableColumnText>
          <Trans>STATUS</Trans>
        </TableColumnText>
        <TableColumnText>
          <Trans>ROUTE</Trans>
        </TableColumnText>
        <TableColumnText>
          <Trans>RECEIVED AMOUNT</Trans>
        </TableColumnText>
        <TableColumnText>
          <Trans>ACTION</Trans>
        </TableColumnText>
      </TableHeader>
      {transfers.map((transfer, i) => (
        <TableRow key={i}>
          <TimeCell timestamp={transfer.createdAt * 1000} />
          <StatusBadge status={transfer.status} />
          <RouteCell fromChainID={Number(transfer.srcChainId)} toChainID={Number(transfer.dstChainId)} />
          <TokenReceiveCell transfer={transfer} />
          <ActionCell hash={transfer.srcTxHash} />
        </TableRow>
      ))}
      {renderInvisibleRows()}
    </Flex>
  )
}

export default Desktop
