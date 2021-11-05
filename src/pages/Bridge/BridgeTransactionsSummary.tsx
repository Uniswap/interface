import React, { useCallback, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { ButtonPrimary, ShowMoreButton } from '../../components/Button'
import { Table, Th } from '../../components/Table'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/types'
import { TYPE } from '../../theme'
import { BridgeStatusTag } from './BridgeStatusTag'
import { NETWORK_DETAIL } from '../../constants'
import { useBridgeTxsFilter } from '../../state/bridge/hooks'
import { BridgeTxsFilter } from '../../state/bridge/reducer'
import { getExplorerLink } from '../../utils'
import { useWindowSize } from '../../hooks/useWindowSize'

interface BridgeTransactionsSummaryProps {
  transactions: BridgeTransactionSummary[]
  collectableTx: BridgeTransactionSummary
  onCollect: (tx: BridgeTransactionSummary) => void
}

export const BridgeTransactionsSummary = ({
  transactions,
  collectableTx,
  onCollect
}: BridgeTransactionsSummaryProps) => {
  const [txsFilter, setTxsFilter] = useBridgeTxsFilter()

  const toggleFilter = useCallback(() => {
    if (txsFilter !== BridgeTxsFilter.RECENT) setTxsFilter(BridgeTxsFilter.RECENT)
    else setTxsFilter(BridgeTxsFilter.NONE)
  }, [setTxsFilter, txsFilter])

  return (
    <div style={{ marginTop: '10px' }}>
      <AdvancedDetailsFooter fullWidth padding="16px">
        <Table>
          <thead>
            <tr>
              <Th>Bridging</Th>
              <Th align="right">From</Th>
              <Th align="right">To</Th>
              <Th align="right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {Object.values(transactions).map((tx, index) => (
              <BridgeTransactionsSummaryRow
                transactionsLength={transactions.length}
                key={index}
                tx={tx}
                onCollect={onCollect}
              />
            ))}
          </tbody>
        </Table>
        {collectableTx && (
          <ButtonPrimary onClick={() => onCollect(collectableTx)} mt="12px">
            Collect
          </ButtonPrimary>
        )}
      </AdvancedDetailsFooter>

      <ShowMoreButton isOpen={txsFilter === BridgeTxsFilter.NONE} onClick={toggleFilter}>
        Past transactions
      </ShowMoreButton>
    </div>
  )
}

const Td = styled.td`
  padding: 0 8px;

  &:not(:first-child) {
    text-align: right;
  }
`

const Link = styled.a`
  cursor: initial;
  color: #0e9f6e;

  &[href] {
    cursor: pointer;
  }

  &[href]:hover {
    text-decoration: underline;
  }
`

const TextFrom = styled.div`
  position: relative;
`

const Progress = styled.span<{ dashedLineWidth: number; success: boolean }>`
  position: absolute;
  right: -3px;
  top: 50%;
  transform: translate(100%, -50%);
  width: ${({ dashedLineWidth }) => dashedLineWidth - 2 + 'px'};
  height: 2px;
  background-color: #8780bf;
  -webkit-mask-image: repeating-linear-gradient(90deg, transparent, transparent 2px, black 2px, black 4px);
  mask-image: repeating-linear-gradient(90deg, transparent, transparent 2px, black 2px, black 4px);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: ${({ success }) => (success ? '100%' : '50%')};
    height: 100%;
    background-color: #0e9f6e;
  }
`

const TextTo = styled(Link)<{ success: boolean }>`
  color: ${({ success }) => (success ? '#0e9f6e' : '#8780bf')};
`

interface BridgeTransactionsSummaryRow {
  tx: BridgeTransactionSummary
  onCollect: BridgeTransactionsSummaryProps['onCollect']
  transactionsLength: number
}

const BridgeTransactionsSummaryRow = ({ tx, onCollect, transactionsLength }: BridgeTransactionsSummaryRow) => {
  const { assetName, fromChainId, status, toChainId, value, pendingReason, log } = tx

  const refFrom = useRef<HTMLDivElement>(null)
  const refTo = useRef<HTMLAnchorElement>(null)
  const [dashedLineWidth, setDashedLineWidth] = useState(0)

  const windowSize = useWindowSize()

  useEffect(() => {
    if (refFrom && refFrom.current && refTo && refTo.current) {
      const refFromX = refFrom.current.getBoundingClientRect().right
      const refToX = refTo.current.getBoundingClientRect().left
      setDashedLineWidth(refToX - refFromX - 3)
    }
  }, [transactionsLength, windowSize.width])

  const success = status === 'confirmed' || status === 'claimed'

  return (
    <tr style={{ lineHeight: '22px' }}>
      <Td>
        <TYPE.main color="white" fontSize="14px" lineHeight="14px" fontWeight="600">
          {`${value} ${assetName}`}
        </TYPE.main>
      </Td>
      <Td>
        <TYPE.main color="text4" fontSize="10px" lineHeight="12px" display="inline">
          <TextFrom ref={refFrom}>
            <Link
              href={getExplorerLink(log[0].chainId, log[0].txHash, 'transaction')}
              rel="noopener noreferrer"
              target="_blank"
            >
              {NETWORK_DETAIL[fromChainId].chainName}
            </Link>
            <Progress success={success} dashedLineWidth={dashedLineWidth} />
          </TextFrom>
        </TYPE.main>
      </Td>
      <Td>
        <TYPE.main color="text4" fontSize="10px" lineHeight="12px" display="inline">
          <TextTo
            success={success}
            ref={refTo}
            href={log[1] && getExplorerLink(log[1].chainId, log[1].txHash, 'transaction')}
            rel="noopener noreferrer"
            target="_blank"
          >
            {NETWORK_DETAIL[toChainId].chainName}
          </TextTo>
        </TYPE.main>
      </Td>
      <td align="right">
        <BridgeStatusTag status={status} pendingReason={pendingReason} onCollect={() => onCollect(tx)} />
      </td>
    </tr>
  )
}
