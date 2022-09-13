import { ArrowDownLeft, ArrowUpRight } from 'react-feather'
import { BnbPrices, useBnbPrices } from 'state/logs/bscUtils'
import { CurrencyAmount, WETH9 } from '@uniswap/sdk-core'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ExternalLink, TYPE } from '../../theme'
import { abbreviateNumber, useTotalSwapVolume } from 'components/BurntKiba'
import styled, { keyframes } from 'styled-components/macro'
import { useEffect, useState } from 'react'

import Loader from 'components/Loader'
import React from 'react'
import { Trans } from '@lingui/react'
import _ from 'lodash'
import { useActiveWeb3React } from '../../hooks/web3'
import { useBlockNumber } from '../../state/application/hooks'
import { useCurrency } from 'hooks/Tokens'
import { useEthPrice } from 'state/logs/utils'
import { useIsDarkMode } from 'state/user/hooks'
import useTheme from 'hooks/useTheme'
import { useTotalSwapVolumeBnbToUsd } from 'pages/Vote/VotePage'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useV2RouterContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'
import { utils } from 'ethers'

const StyledEthPolling = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  color: ${({ theme }) => theme.green1};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`
const StyledPolling = styled.div`
  display:flex;
  padding: 1rem;
  color: ${({ theme }) => theme.green1};
  align-items:center;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`
const StyledPollingNumber = styled(TYPE.small)`
  transition: opacity 0.25s ease;
  :hover {
    opacity: 1;
  }
`
const StyledPollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  align-items:center;
  vertical-align:middle;
  margin-left: 0.5rem;
  border-radius: 50%;
  position: relative;
  background-color: ${({ theme }) => theme.green1};
`

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Spinner = styled.div`
  animation: ${rotate360} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  transform: translateZ(0);

  border-top: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme }) => theme.green1};
  background: transparent;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  position: relative;

  left: -3px;
  top: -3px;
`


const PollContainer = styled.div<{ display: string, darkMode: boolean }>`
position: fixed;
display: ${props => props.display};
align-items: center;
left: 0;
bottom: 0;
z-index:1111;  
background: ${props => props.darkMode ? `rgba(37, 38, 50, 0.7)` : `rgb(251 251 251 / 80%)`};
border-top-right-radius:10px;
`


const StyledLoader = styled(Loader)`
  margin-right: 1rem;
`

export default function SwapVolume() {
  const {
    volumeInEth,
    volumeInEthBn,
    volumeInUsd,
    volumeInUsdFormatted
  } = useTotalSwapVolume()
  const {
    chainId
  } = useWeb3React()
  const ethPrices = useEthPrice()
  const bnbPrices = useBnbPrices()
  const prices = (chainId && chainId == 1 || !chainId) ? ethPrices : bnbPrices
  const [swapVolumeInBUSD, setSwapVolumeInBusd] = useTotalSwapVolumeBnbToUsd()
  const ethPrice = React.useMemo(() => chainId && chainId === 56 ?
    (bnbPrices as BnbPrices).current :
    prices && Array.isArray(prices) ? prices[0] as any : undefined, [prices, bnbPrices, ethPrices, chainId])
  const isChartsPage = window.location.href.indexOf('charts') > -1;
  const display = isChartsPage ? 'none' : 'block'
  const darkMode = useIsDarkMode()
  const [open, setOpen] = React.useState(true)
  const Icon = !open ? ArrowUpRight : ArrowDownLeft
  const toggleOpen = () => setOpen(!open)
  const theme = useTheme()
  return (
    <PollContainer darkMode={darkMode} display={display}>
      <div style={{ background:theme.bg0, width:210, height: !open ? 13 : 11, zIndex:0, top: 0, left: 0, cursor: 'pointer', position: 'relative' }}>
        <TYPE.link onClick={toggleOpen}  style={{ fontWeight:500,  fontSize:9, position: 'absolute', right: 5, bottom: open ? -2 : 0 }} >Toggle Stats<Icon color={theme.text1} size={12} /></TYPE.link>
      </div>
      {open && (
        <React.Fragment>
          <StyledEthPolling>
            {!prices || isNaN(+ethPrice) ? (
              <>
                <StyledPollingNumber>
                  Loading..
                </StyledPollingNumber>
                <StyledPollingDot>
                  <Spinner />
                </StyledPollingDot>
              </>
            ) : (
              <>
                <StyledPollingNumber>
                  {(chainId && chainId === 1 || (!chainId)) && <span style={{ color: '#F76C1D' }}>ETH</span>}
                  {(chainId && chainId === 56) && <span style={{ color: '#F76C1D' }}>BNB</span>}
                  {chainId && chainId === 56 && <>${bnbPrices?.current !== undefined && !isNaN(bnbPrices?.current) ? `${parseFloat(bnbPrices?.current?.toString()).toFixed(2)} USD` : 'Loading..'}</>}
                  {(!chainId || (chainId && chainId === 1))  && <>&nbsp;{`$${parseFloat(ethPrices[0] as string).toFixed(2)} USD`}</>}
                </StyledPollingNumber>
                <StyledPollingDot>{volumeInEthBn == 0 && <Spinner />}</StyledPollingDot>
              </>
            )}
          </StyledEthPolling>

          <StyledEthPolling >
            {volumeInEthBn == 0 ? (
              <>
                <StyledPollingNumber>
                  Loading..
                </StyledPollingNumber>
                <StyledPollingDot>
                  <Spinner />
                </StyledPollingDot>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StyledPollingNumber>
                  <span style={{ color: '#F76C1D' }}>Total Swap Volume</span> <br /> {volumeInEth} Ξ
                  {chainId && (chainId === 1 || !chainId) && <>
                    {volumeInUsdFormatted && volumeInUsd.toString() !== '0' && <>&nbsp;(${(abbreviateNumber(+volumeInUsd))} USD)</>}
                  </>}

                  {chainId && (chainId === 56) && <>
                    {(swapVolumeInBUSD && swapVolumeInBUSD !== '0') && <>&nbsp;(${(((swapVolumeInBUSD as string)))} USD)</>}
                  </>}
                  <StyledPollingDot style={{ display: 'inline-block' }}>{volumeInEthBn == 0 && <Spinner />}</StyledPollingDot>
                </StyledPollingNumber>
              </div>
            )}
          </StyledEthPolling>
        </React.Fragment>
      )}
    </PollContainer>

  )
}