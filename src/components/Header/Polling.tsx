import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { TYPE, ExternalLink } from '../../theme'

import { useBlockNumber } from '../../state/application/hooks'
import { getEtherscanLink } from '../../utils'
import { useActiveWeb3React } from '../../hooks'

const StyledPolling = styled.div`
  position: fixed;
  display: flex;
  justify-content: center;
  top: 0.5rem;
  padding: 1rem;
  color: white;
  transition: opacity 0.25s ease;
  color: ${({ theme }) => theme.green1};
  :hover {
    opacity: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`
const StyledPollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  margin-left: 0.5rem;
  margin-right: 0rem;
  margin-top: 3px;
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

export default function Polling() {
  const footerStyles = { marginLeft: '0.5rem', marginRight: '0.5rem' }

  const { chainId } = useActiveWeb3React()

  const blockNumber = useBlockNumber()

  const [isMounted, setIsMounted] = useState(true)

  useEffect(
    () => {
      const timer1 = setTimeout(() => setIsMounted(true), 1000)

      // this will clear Timeout when component unmount like in willComponentUnmount
      return () => {
        setIsMounted(false)
        clearTimeout(timer1)
      }
    },
    [blockNumber] //useEffect will run only one time
    //if you pass a value to array, like this [data] than clearTimeout will run every time this value changes (useEffect re-run)
  )

  return (
    <StyledPolling>
      <TYPE.small style={{ opacity: isMounted ? '0.9' : '0.7' }}>Block# </TYPE.small>
      <StyledPollingDot>{!isMounted && <Spinner />}</StyledPollingDot>

      <ExternalLink
        style={footerStyles}
        href={chainId && blockNumber ? getEtherscanLink(chainId, blockNumber.toString(), 'block') : ''}
      >
        <TYPE.small style={{ opacity: isMounted ? '0.9' : '0.7' }}>{blockNumber}</TYPE.small>
      </ExternalLink>
      <ExternalLink style={footerStyles} href={'https://discord.gg/VZkFP78aeF'}>
        <TYPE.small>Discord</TYPE.small>
      </ExternalLink>
      <ExternalLink style={footerStyles} href={'https://medium.com/@trojanfinance'}>
        <TYPE.small>Medium</TYPE.small>
      </ExternalLink>
      <ExternalLink style={footerStyles} href={'https://twitter.com/FinanceTrojan'}>
        <TYPE.small>Twitter</TYPE.small>
      </ExternalLink>
      <ExternalLink style={footerStyles} href={'https://github.com/we-commit'}>
        <TYPE.small>Github</TYPE.small>
      </ExternalLink>
      <TYPE.small style={{ marginLeft: '0.5rem' }} color={'#6C7284'}>
        Proposals (Soon)
      </TYPE.small>
    </StyledPolling>
  )
}
