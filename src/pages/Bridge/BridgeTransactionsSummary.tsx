import React, { useState } from 'react'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { ButtonPrimary } from '../../components/Button'
import { HideableAutoColumn, HideableAutoColumnProps } from '../../components/Column'
import { Table, Th } from '../../components/Table'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/hooks'
import { BridgeTxn } from '../../state/bridgeTransactions/types'
import { TYPE } from '../../theme'
import { BridgeStatusTag } from './BridgeStatusTag'

interface BridgeTransactionsSummaryProps extends HideableAutoColumnProps {
  transactions: BridgeTransactionSummary[]
  onCollect: ({ batchIndex, batchNumber, value }: Pick<BridgeTxn, 'batchIndex' | 'batchNumber' | 'value'>) => void
}

export const BridgeTransactionsSummary = ({ show, transactions, onCollect }: BridgeTransactionsSummaryProps) => {
  const [selectedTx] = useState(() => transactions.filter(tx => tx.status === 'redeem')[0] || undefined)

  return (
    <HideableAutoColumn show={show}>
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
              const { assetName, fromName, status, toName, value, batchIndex, batchNumber, pendingReason } = tx

              return (
                <tr key={index} style={{ lineHeight: '22px' }}>
                  <td>
                    <TYPE.main color="white" fontSize="14px" lineHeight="14px" fontWeight="600">
                      {`${value} ${assetName}`}
                    </TYPE.main>
                  </td>
                  <td align="left">
                    <TYPE.main color="text4" fontSize="10px" lineHeight="12px" paddingLeft="9px">
                      {fromName}
                    </TYPE.main>
                  </td>
                  <td align="left">
                    <TYPE.main color="text4" fontSize="10px" lineHeight="12px" paddingLeft="9px">
                      {toName}
                    </TYPE.main>
                  </td>
                  <td align="left">
                    <BridgeStatusTag
                      status={status}
                      pendingReason={pendingReason}
                      onCollect={() => onCollect({ value, batchIndex, batchNumber })}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        {selectedTx && (
          <ButtonPrimary
            onClick={() =>
              onCollect({
                value: selectedTx.value,
                batchIndex: selectedTx.batchIndex,
                batchNumber: selectedTx.batchNumber
              })
            }
            mt="12px"
          >
            Collect
          </ButtonPrimary>
        )}
      </AdvancedDetailsFooter>
    </HideableAutoColumn>
  )
}
