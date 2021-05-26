import React from 'react'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { HideableAutoColumn } from '../../components/Column'
import Radio from '../../components/Radio'
import { Table, Th } from '../../components/Table'
import { TYPE } from '../../theme'

interface FooterBridgeSelectorProps {
  show: boolean
  onBridgeChange: () => void
}

export const FooterBridgeSelector = ({show, onBridgeChange}: FooterBridgeSelectorProps) => {
  return (
    <HideableAutoColumn show={show}>
      <AdvancedDetailsFooter fullWidth padding="16px">
        <Table>
          <thead>
            <tr>
              <Th>Bridge</Th>
              <Th align="right">Fee</Th>
              <Th align="right">Gas</Th>
              <Th align="right">Time</Th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ lineHeight: '22px' }}>
              <td>
                <Radio
                  checked={true}
                  label="Swapr Fast Exit"
                  value=""
                  onChange={onBridgeChange}
                />
              </td>
              <td align="right">
                <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
                  0.05%
                </TYPE.main>
              </td>
              <td align="right">
                <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
                  13$
                </TYPE.main>
              </td>
              <td align="right">
                <TYPE.subHeader color="white" fontSize="12px" fontWeight="600">
                  30 min
                </TYPE.subHeader>
              </td>
            </tr>
          </tbody>
        </Table>
      </AdvancedDetailsFooter>
    </HideableAutoColumn>
  )
}
