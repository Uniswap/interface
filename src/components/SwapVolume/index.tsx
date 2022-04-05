import { CurrencyAmount, WETH9 } from '@uniswap/sdk-core'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ExternalLink, TYPE } from '../../theme'
import styled, { keyframes } from 'styled-components/macro'
import { useEffect, useState } from 'react'

import Loader from 'components/Loader'
import React from 'react'
import { Trans } from '@lingui/react'
import _ from 'lodash'
import { useActiveWeb3React } from '../../hooks/web3'
import { useBlockNumber } from '../../state/application/hooks'
import { useCurrency } from 'hooks/Tokens'
import { useTotalSwapVolume } from 'components/BurntKiba'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useV2RouterContract } from 'hooks/useContract'
import { utils } from 'ethers'
import { useEthPrice } from 'state/logs/utils'
import { useBnbPrices } from 'state/logs/bscUtils'


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


const PollContainer = styled.div`
position: fixed;
display: block;
align-items: center;
left: 0;
bottom: 0;
`


const StyledLoader = styled(Loader)`
  margin-right: 1rem;
`

export default function SwapVolume() {
  const {
    volumeInEth,
    volumeInEthBn,
    volumeInUsd
  } = useTotalSwapVolume()
  const prices = useBnbPrices()
  const [ethPrice,,] = useEthPrice()
  return (
    <PollContainer>
    <StyledEthPolling>
    {!ethPrice || isNaN(+ethPrice) ? (
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
            <span style={{ color: '#F76C1D' }}>ETH</span> {ethPrice && volumeInUsd !== 'NaN' && <>(${(parseFloat(ethPrice.toString()).toFixed(2))} USD)</>}
          </StyledPollingNumber>
          <StyledPollingDot>{volumeInEthBn == 0 && <Spinner />}</StyledPollingDot>
        </>
      )}
    </StyledEthPolling>
    
    <StyledPolling >
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
        <>
          <StyledPollingNumber>
            <span style={{ color: '#F76C1D' }}>Total Swap Volume</span> <br /> {volumeInEth} Ξ {volumeInUsd && volumeInUsd !== 'NaN' && <>(${(volumeInUsd)} USD)</>}
          </StyledPollingNumber>
          <StyledPollingDot>{volumeInEthBn == 0 && <Spinner />}</StyledPollingDot>
        </>
      )}
    </StyledPolling>
    </PollContainer>

  )
}