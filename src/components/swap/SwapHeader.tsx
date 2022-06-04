import { RowBetween, RowFixed } from '../Row'

import { Info } from 'react-feather'
import { Percent } from '@uniswap/sdk-core'
import React from 'react'
import SettingsTab from '../Settings'
import { ShowSellTaxComponent } from 'components/ShowSellTax'
import { TYPE } from '../../theme'
import Tooltip from 'components/Tooltip'
import { TopTokenMovers } from './TopMovers'
import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { useEthPrice } from 'state/logs/utils'
import { useWeb3React } from '@web3-react/core'

const StyledSwapHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

const HeaderType = styled(TYPE.black)`

font-family:'Bangers', cursive !important;
&:hover {
  transition: all ease 0.2s;
  color:#F76C1D;
}`

export default function SwapHeader({ allowedSlippage, view, onViewChange }: { allowedSlippage: Percent, view: 'bridge' | 'swap' | 'limit' | 'flooz', onViewChange: (view: "bridge"  | "swap" | 'limit' | 'flooz') => void }) {
   const [showBridgeTip, setShowBridgeTip] = React.useState(false)
   const {chainId} = useWeb3React()
  const tipMessage = `Contract interaction fees will still occur when using the bridge, just like any other transactions (buys, transfers, sells). Redistribution fees will still occur.`
  const onBridgeClick = ( ) => onViewChange('bridge');
  const onLimitClick = ( ) => onViewChange('limit');
  const onSwapClick = ( ) => onViewChange('swap') 
  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed style={{display:'flex', alignItems:'center'}}>
          <HeaderType  onClick={onSwapClick} fontWeight={500} fontSize={22} style={{ textDecoration: view === 'swap' ? 'underline' : 'none', cursor: 'pointer', marginRight: '8px' }}>
            <Trans>Swap</Trans>
          </HeaderType>


        
          
          {<HeaderType  onClick={onLimitClick} fontWeight={500} fontSize={22} style={{ textDecoration: view === 'limit' ? 'underline' : 'none', cursor: 'pointer', marginLeft:'8px', marginRight: '8px' }}>
            <Trans>Limit</Trans>
          </HeaderType>}
          
               
                    
          {<HeaderType  onClick={onBridgeClick} fontWeight={500} fontSize={22} style={{ textDecoration: view === 'bridge' ? 'underline' : 'none', cursor: 'pointer', marginLeft:'8px', marginRight: '8px' }}>
            <Trans>Bridge</Trans>
          </HeaderType>}
          
          
    
        </RowFixed>
        {chainId === 1 && (
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
        )}
      </RowBetween>
  </StyledSwapHeader>
  )
}
