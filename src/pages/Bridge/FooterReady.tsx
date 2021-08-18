import React from 'react'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { ButtonPrimary } from '../../components/Button'
import { HideableAutoColumn, HideableAutoColumnProps } from '../../components/Column'
import { Table, Th } from '../../components/Table'
import { TagSuccessArrow } from '../../components/Tag'
import { TYPE } from '../../theme'

interface FooterReadyProps extends HideableAutoColumnProps{
  amount: string;
  onCollectButtonClick: () => void;
}

export const FooterReady = ({show, onCollectButtonClick, amount}: FooterReadyProps) => {
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
                <TagSuccessArrow onClick={onCollectButtonClick}>
                  Ready
                </TagSuccessArrow>
              </td>
            </tr>
          </tbody>
        </Table>
        <ButtonPrimary onClick={onCollectButtonClick} mt="12px">
          Collect
        </ButtonPrimary>
      </AdvancedDetailsFooter>
    </HideableAutoColumn>
  )
}
