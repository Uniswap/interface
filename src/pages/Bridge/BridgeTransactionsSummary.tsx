import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { ButtonPrimary, ShowMoreButton } from '../../components/Button'
import { HideableAutoColumn } from '../../components/Column'
import { Table, Th } from '../../components/Table'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/types'
import { ExternalLink, TYPE } from '../../theme'
import { BridgeStatusTag } from './BridgeStatusTag'
import { NETWORK_DETAIL } from '../../constants'
import { useBridgeTxsFilter } from '../../state/bridge/hooks'
import { BridgeTxsFilter } from '../../state/bridge/reducer'
import { Loader, CheckCircle, Triangle } from 'react-feather'
import { getExplorerLink } from '../../utils'

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
    <>
      <HideableAutoColumn show>
        <AdvancedDetailsFooter fullWidth padding="16px">
          <Table>
            <thead>
              <tr>
                <Th>Bridging</Th>
                <Th align="left">From</Th>
                <Th align="left">To</Th>
                <Th align="left">Status</Th>
              </tr>
            </thead>
            <tbody>
              {Object.values(transactions).map((tx, index) => (
                <BridgeTransactionsSummaryRow key={index} tx={tx} onCollect={onCollect} />
              ))}
            </tbody>
          </Table>
          {collectableTx && (
            <ButtonPrimary onClick={() => onCollect(collectableTx)} mt="12px">
              Collect
            </ButtonPrimary>
          )}
        </AdvancedDetailsFooter>
      </HideableAutoColumn>

      <ShowMoreButton isOpen={txsFilter === BridgeTxsFilter.NONE} onClick={toggleFilter}>
        Past transactions
      </ShowMoreButton>
    </>
  )
}

const ClickableTd = styled.td`
  cursor: pointer;
`

const ClickableTr = styled.tr`
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }
`

const TransactionState = styled(ExternalLink)``

const IconWrapper = styled.div<{ pending: boolean; success?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3px 0px;
  color: ${({ pending, success, theme }) => (pending ? theme.primary1 : success ? theme.green1 : theme.red1)};
`

interface BridgeTransactionsSummaryRow {
  tx: BridgeTransactionSummary
  onCollect: BridgeTransactionsSummaryProps['onCollect']
}

const BridgeTransactionsSummaryRow = ({ tx, onCollect }: BridgeTransactionsSummaryRow) => {
  const [showLog, setShowLog] = useState(false)
  const { assetName, fromChainId, status, toChainId, value, pendingReason, log } = tx

  return (
    <>
      <tr style={{ lineHeight: '22px' }} onClick={() => setShowLog(show => !show)}>
        <ClickableTd>
          <TYPE.main color="white" fontSize="14px" lineHeight="14px" fontWeight="600">
            {`${value} ${assetName}`}
          </TYPE.main>
        </ClickableTd>
        <ClickableTd align="left">
          <TYPE.main color="text4" fontSize="10px" lineHeight="12px" paddingLeft="9px">
            {NETWORK_DETAIL[fromChainId].chainName}
          </TYPE.main>
        </ClickableTd>
        <ClickableTd align="left">
          <TYPE.main color="text4" fontSize="10px" lineHeight="12px" paddingLeft="9px">
            {NETWORK_DETAIL[toChainId].chainName}
          </TYPE.main>
        </ClickableTd>
        <td align="left">
          <BridgeStatusTag status={status} pendingReason={pendingReason} onCollect={() => onCollect(tx)} />
        </td>
      </tr>

      {showLog &&
        log.map(logTx => {
          const { status, txHash, type, chainId, fromChainId, toChainId } = logTx
          const pending = status === 'pending'
          const success = status === 'confirmed'

          return (
            <ClickableTr key={`${txHash}`}>
              <td>
                <div>
                  <TransactionState href={getExplorerLink(chainId, txHash, 'transaction')}>
                    <TYPE.main
                      display="flex"
                      alignItems="center"
                      justifyContent="flex-start"
                      color="text4"
                      fontSize="12px"
                      lineHeight="12px"
                      paddingLeft="16px"
                    >
                      {`${type} (${NETWORK_DETAIL[chainId].isArbitrum ? 'l2' : 'l1'}) ↗`}
                    </TYPE.main>
                  </TransactionState>
                </div>
              </td>
              <td align="center">
                {chainId === fromChainId && (
                  <TransactionState href={getExplorerLink(chainId, txHash, 'transaction')}>
                    <IconWrapper pending={pending} success={success}>
                      {pending ? <Loader /> : success ? <CheckCircle size="16" /> : <Triangle size="16" />}
                    </IconWrapper>
                  </TransactionState>
                )}
              </td>
              <td align="center">
                {chainId === toChainId && (
                  <TransactionState href={getExplorerLink(chainId, txHash, 'transaction')}>
                    <IconWrapper pending={pending} success={success}>
                      {pending ? <Loader /> : success ? <CheckCircle size="16" /> : <Triangle size="16" />}
                    </IconWrapper>
                  </TransactionState>
                )}
              </td>
            </ClickableTr>
          )
        })}
    </>
  )
}
