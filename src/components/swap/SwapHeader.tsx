import { RowBetween, RowFixed } from '../Row'
import { StyledInternalLink, TYPE } from '../../theme'

import { Percent } from '@uniswap/sdk-core'
import { useContext } from 'react'
import SettingsTab from '../Settings'
import { Trans } from '@lingui/macro'
import styled, { ThemeContext } from 'styled-components/macro'
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
padding: 14px 40px 10px 40px;
border-top-right-radius: 24px;
border-top-left-radius: 24px;
font-family: 'Poppins' !important;
font-size:${props => props.isMobile ? '14px' : '17px'};
&:hover {
  transition: all ease 0.2s;
  color:#F76C1D;
}`

export default function SwapHeader({ allowedSlippage, view, onViewChange, }: { allowedSlippage: Percent, view: 'bridge' | 'swap' | 'limit' | 'flooz', onViewChange: (view: "bridge" | "swap" | 'limit' | 'flooz') => void }) {
  const { chainId } = useWeb3React()
  const onBridgeClick = () => onViewChange('bridge');
  const onLimitClick = () => onViewChange('limit');
  const onSwapClick = () => onViewChange('swap')
  const isMobile = useIsMobile()
  const theme = useContext(ThemeContext)
  return (
    <StyledSwapHeader style={{ background: theme.bgSwapHeader }}>
      <RowBetween>
        <RowFixed style={{ display: 'flex', alignItems: 'center' }}>
          <HeaderType isMobile={isMobile} onClick={onSwapClick} fontWeight={view === 'swap' ? 700 : 400} style={{ color: view === 'swap' ? '#F76C1D' : '', cursor: 'pointer', background: view === 'swap' ? theme.bg0 : 'transparent' }}>
            <Trans>Swap</Trans>
          </HeaderType>

          {<HeaderType isMobile={isMobile} onClick={onLimitClick} fontWeight={view === 'limit' ? 700 : 400} style={{ color: view === 'limit' ? '#F76C1D' : '', cursor: 'pointer', background: view === 'limit' ? theme.bg0 : 'transparent' }}>
            <Trans>Limit</Trans>
          </HeaderType>}

          {<HeaderType isMobile={isMobile} onClick={onBridgeClick} fontWeight={view === 'bridge' ? 700 : 400} style={{ color: view === 'bridge' ? '#F76C1D' : '', cursor: 'pointer', background: view === 'bridge' ? theme.bg0 : 'transparent' }}>
            <Trans>Bridge</Trans>
          </HeaderType>}


        </RowFixed>
        {chainId === 1 && (
          <RowFixed alignItems="center">
            {<StyledInternalLink style={{ fontSize: isMobile ? 12 : 14, marginRight: isMobile ? 0 : 15 }} to="/bridge">Crosschain</StyledInternalLink>}

            <SettingsTab placeholderSlippage={allowedSlippage} />
          </RowFixed>
        )}
      </RowBetween>
    </StyledSwapHeader>
  )
}
