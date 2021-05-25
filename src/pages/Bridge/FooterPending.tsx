import React from 'react'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { HideableAutoColumn, HideableAutoColumnProps } from '../../components/Column'
import { Table, Th } from '../../components/Table'
import { TagPending } from '../../components/Tag'
import { TYPE } from '../../theme'

interface FooterPendingProps extends HideableAutoColumnProps {
  amount: string;
}

export const FooterPending = ({show, amount}: FooterPendingProps) => {
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
            <tr style={{ lineHeight: '22px' }}>
              <td>
                <TYPE.main color="white" fontSize="14px" lineHeight="14px" fontWeight="600">
                  {amount} ETH
                </TYPE.main>
              </td>
              <td align="right">
                <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
                  Arbitrum
                </TYPE.main>
              </td>
              <td align="right">
                <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
                  Ethereum
                </TYPE.main>
              </td>
              <td align="right">
                <TagPending/>
              </td>
            </tr>
          </tbody>
        </Table>
      </AdvancedDetailsFooter>
    </HideableAutoColumn>
  )
}


