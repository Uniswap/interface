import { RowBetween, RowFixed } from '../Row'
import { StyledInternalLink, TYPE } from '../../theme'
import styled, { ThemeContext } from 'styled-components/macro'

import { Percent } from '@uniswap/sdk-core'
import SettingsTab from '../Settings'
import { Trans } from '@lingui/macro'
import { useContext } from 'react'
import { useIsMobile } from 'pages/Swap/SelectiveCharting'
import { useWeb3React } from '@web3-react/core'

const StyledSwapHeader = styled.div`
  width: 100%;
  border-top-right-radius: 24px;
  border-top-left-radius: 24px;
  background: 
  color: ${({ theme }) => theme.text2};
`

const HeaderType = styled(TYPE.black) <{ isMobile: boolean }>`
padding: ${props => !props.isMobile ?  '14px 40px 10px 40px' : '14px'};
border-top-right-radius: 24px;
border-top-left-radius: 24px;
font-family: 'Poppins' !important;
font-size:${props => props.isMobile ? '14px' : '17px'};
&:hover {
  transition: all ease 0.2s;
  color:#F76C1D;
}`

export default function SwapHeader({ allowedSlippage, view, onViewChange, }: { allowedSlippage: Percent, view: 'bridge' | 'swap' | 'limit' | 'crosschain', onViewChange: (view: "bridge" | "swap" | 'limit' | 'crosschain') => void }) {
  const { chainId } = useWeb3React()
  const onBridgeClick = () => onViewChange('bridge');
  const onLimitClick = () => onViewChange('limit');
  const onSwapClick = () => onViewChange('swap')
  const onCrosschainClick = () => onViewChange('crosschain')
  const isMobile = useIsMobile()
  const theme = useContext(ThemeContext)
  return (
    <StyledSwapHeader style={{ background: theme.bgSwapHeader }}>
      <RowBetween>
        <RowFixed style={{ display: 'flex', alignItems: 'center' }}>
          <HeaderType isMobile={isMobile} onClick={onSwapClick} fontWeight={view === 'swap' ? 700 : 400} style={{ color: view === 'swap' ? '#F76C1D' : '', cursor: 'pointer', background: view === 'swap' ? theme.bg0 : 'transparent' }}>
            <Trans>Swap</Trans>
          </HeaderType>

          {Boolean(!chainId || chainId === 1 || chainId === 56) && <HeaderType isMobile={isMobile} onClick={onLimitClick} fontWeight={view === 'limit' ? 700 : 400} style={{ color: view === 'limit' ? '#F76C1D' : '', cursor: 'pointer', background: view === 'limit' ? theme.bg0 : 'transparent' }}>
            <Trans>Limit</Trans>
          </HeaderType>}

          {<HeaderType isMobile={isMobile} onClick={onBridgeClick} fontWeight={view === 'bridge' ? 700 : 400} style={{ color: view === 'bridge' ? '#F76C1D' : '', cursor: 'pointer', background: view === 'bridge' ? theme.bg0 : 'transparent' }}>
            <Trans>Bridge</Trans>
          </HeaderType>}

          {<HeaderType isMobile={isMobile} onClick={onCrosschainClick} fontWeight={view === 'crosschain' ? 700 : 400} style={{ color: view === 'crosschain' ? '#F76C1D' : '', cursor: 'pointer', background: view === 'crosschain' ? theme.bg0 : 'transparent' }}>
            <Trans>Crosschain</Trans>
          </HeaderType>}


        </RowFixed>
        <RowFixed alignItems="center" style={{gap: 5, marginRight:isMobile ? '' : 15, marginBottom:isMobile ? '' : 5}}>
        
        {chainId === 1 && (
            <SettingsTab placeholderSlippage={allowedSlippage} />
        )}
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
