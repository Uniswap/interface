import React, { useCallback } from 'react'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { ButtonPrimary, ShowMoreButton } from '../../components/Button'
import { HideableAutoColumn } from '../../components/Column'
import { Table, Th } from '../../components/Table'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/types'
import { TYPE } from '../../theme'
import { BridgeStatusTag } from './BridgeStatusTag'
import { NETWORK_DETAIL } from '../../constants'
import { useBridgeTxsFilter } from '../../state/bridge/hooks'
import { BridgeTxsFilter } from '../../state/bridge/reducer'

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
              {Object.values(transactions).map((tx, index) => {
                const { assetName, fromChainId, status, toChainId, value, pendingReason } = tx

                return (
                  <tr key={index} style={{ lineHeight: '22px' }}>
                    <td>
                      <TYPE.main color="white" fontSize="14px" lineHeight="14px" fontWeight="600">
                        {`${value} ${assetName}`}
                      </TYPE.main>
                    </td>
                    <td align="left">
                      <TYPE.main color="text4" fontSize="10px" lineHeight="12px" paddingLeft="9px">
                        {NETWORK_DETAIL[fromChainId].chainName}
                      </TYPE.main>
                    </td>
                    <td align="left">
                      <TYPE.main color="text4" fontSize="10px" lineHeight="12px" paddingLeft="9px">
                        {NETWORK_DETAIL[toChainId].chainName}
                      </TYPE.main>
                    </td>
                    <td align="left">
                      <BridgeStatusTag status={status} pendingReason={pendingReason} onCollect={() => onCollect(tx)} />
                    </td>
                  </tr>
                )
              })}
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
