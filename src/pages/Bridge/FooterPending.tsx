import React from 'react'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { HideableAutoColumn, HideableAutoColumnProps } from '../../components/Column'
import { Table, Th } from '../../components/Table'
// import { TagPending } from '../../components/Tag'
import { CombinedBridgeTxn } from '../../state/bridgeTransactions/hooks'
import { TYPE } from '../../theme'

interface FooterPendingProps extends HideableAutoColumnProps {
  transactions: CombinedBridgeTxn[]
}

export const FooterPending = ({ show, transactions }: FooterPendingProps) => {
  return (
    <HideableAutoColumn show={show}>
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
            {Object.values(transactions).map(tx => {
              const { assetName, fromName, status, toName, value, txHash } = tx

              return (
                <tr key={txHash} style={{ lineHeight: '22px' }}>
                  <td>
                    <TYPE.main color="white" fontSize="14px" lineHeight="14px" fontWeight="600">
                      {`${value} ${assetName}`}
                    </TYPE.main>
                  </td>
                  <td align="right">
                    <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
                      {fromName}
                    </TYPE.main>
                  </td>
                  <td align="right">
                    <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
                      {toName}
                    </TYPE.main>
                  </td>
                  <td align="right">
                    {/* <TagPending /> */}
                    {status}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </AdvancedDetailsFooter>
    </HideableAutoColumn>
  )
}
