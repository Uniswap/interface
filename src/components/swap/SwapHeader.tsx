import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import SettingsTab from '../Settings'
import { Percent } from '@uniswap/sdk-core'
import React from 'react'
import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import { ShowSellTaxComponent } from 'components/ShowSellTax'
import { Info } from 'react-feather'
import Tooltip from 'components/Tooltip'
import { useWeb3React } from '@web3-react/core'
import { useEthPrice } from 'state/logs/utils'

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
  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed style={{display:'flex', alignItems:'center'}}>
          <HeaderType  onClick={( ) => onViewChange('swap')} fontWeight={500} fontSize={22} style={{ textDecoration: view === 'swap' ? 'underline' : 'none', cursor: 'pointer', marginRight: '8px' }}>
            <Trans>Swap</Trans>
          </HeaderType>
          {<HeaderType  onClick={( ) => onViewChange('flooz')} fontWeight={500} fontSize={22} style={{ textDecoration: view === 'flooz' ? 'underline' : 'none', cursor: 'pointer', marginLeft:'8px', marginRight: '8px' }}>
            <Trans>Flooz</Trans>
          </HeaderType>}
          {<HeaderType  onClick={( ) => onViewChange('limit')} fontWeight={500} fontSize={22} style={{ textDecoration: view === 'limit' ? 'underline' : 'none', cursor: 'pointer', marginLeft:'8px', marginRight: '8px' }}>
            <Trans>Limit</Trans>
          </HeaderType>}
          <HeaderType onClick={( ) => onViewChange('bridge')} fontWeight={500} fontSize={22} style={{ textDecoration: view === 'bridge' ? 'underline' : 'none', cursor: 'pointer', marginLeft: '8px' }}>
            <Trans>Bridge   
               <Tooltip show={showBridgeTip} text={tipMessage}>
              <Info style={{height:20,marginLeft:5}} onMouseEnter={() => setShowBridgeTip(true)} onMouseLeave={() => setShowBridgeTip(false)} />
              </Tooltip>
            </Trans>
          </HeaderType>
    
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
