import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import SettingsTab from '../Settings'
import { Percent } from '@uniswap/sdk-core'
import React from 'react'
import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import { ShowSellTaxComponent } from 'components/ShowSellTax'

const StyledSwapHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

const HeaderType = styled(TYPE.black)`

font-family:'Bangers', cursive !important;`

export default function SwapHeader({ allowedSlippage, view, onViewChange }: { allowedSlippage: Percent, view: 'bridge' | 'swap' | 'honey', onViewChange: (view: "bridge"  | "swap" | 'honey') => void }) {
 
  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <HeaderType  onClick={( ) => onViewChange('swap')} fontWeight={500} fontSize={22} style={{ textDecoration: view === 'swap' ? 'underline' : 'none', cursor: 'pointer', marginRight: '8px' }}>
            <Trans>Swap</Trans>
          </HeaderType>
          <HeaderType onClick={( ) => onViewChange('bridge')} fontWeight={500} fontSize={22} style={{ textDecoration: view === 'bridge' ? 'underline' : 'none', cursor: 'pointer', marginLeft: '8px' }}>
            <Trans>Bridge</Trans>
          </HeaderType>
        
        </RowFixed>
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
    </RowFixed>
      </RowBetween>
               </StyledSwapHeader>
  )
}
