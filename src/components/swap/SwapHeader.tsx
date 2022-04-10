import React from 'react'
import styled from 'styled-components/macro'
import SettingsTab from '../Settings'
import { Percent } from '@uniswap/sdk-core'

import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import { PotionIcon4 } from '../Potions/Potions'

const StyledSwapHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

export default function SwapHeader({ allowedSlippage }: { allowedSlippage: Percent }) {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <PotionIcon4 width={40} height={40} />
          <TYPE.black fontWeight={500} fontSize={24} style={{ marginRight: '8px' }}>
            Swap{' '}
          </TYPE.black>
        </RowFixed>
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
