import { CHAIN_INFO } from 'constants/chains'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import ms from 'ms.macro'
import { useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components/macro'

import { useActiveWeb3React } from '../../hooks/web3'
import { useBlockNumber } from '../../state/application/hooks'
import { ExternalLink, TYPE } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ChainConnectivityWarning } from './ChainConnectivityWarning'

const StyledPolling = styled.div<{ warning: boolean }>`
  position: fixed;
  display: flex;
  align-items: center;
  right: 0;
  bottom: 0;
  padding: 1rem;
  color: ${({ theme, warning }) => (warning ? theme.yellow3 : theme.green1)};
  transition: 250ms ease color;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`
const StyledPollingNumber = styled(TYPE.small)<{ breathe: boolean; hovering: boolean }>`
  transition: opacity 0.25s ease;
  opacity: ${({ breathe, hovering }) => (hovering ? 0.7 : breathe ? 1 : 0.5)};
  :hover {
    opacity: 1;
  }
`
const StyledPollingDot = styled.div<{ warning: boolean }>`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  border-radius: 50%;
  position: relative;
  background-color: ${({ theme, warning }) => (warning ? theme.yellow3 : theme.green1)};
  transition: 250ms ease background-color;
`

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Spinner = styled.div<{ warning: boolean }>`
  animation: ${rotate360} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  transform: translateZ(0);

  border-top: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme, warning }) => (warning ? theme.yellow3 : theme.green1)};
  background: transparent;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  position: relative;
  transition: 250ms ease border-color;

  left: -3px;
  top: -3px;
`
const NETWORK_HEALTH_CHECK_MS = ms`15s`
const DEFAULT_MS_BEFORE_WARNING = ms`10m`

export default function Polling() {
  const { chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const [isMounting, setIsMounting] = useState(false)
  const [isHover, setIsHover] = useState(false)
  const [warning, setWarning] = useState(false)
  const blockTimestamp = useCurrentBlockTimestamp()
  const isWindowVisible = useIsWindowVisible()
  const [msSinceLastBlock, setMsSinceLastBlock] = useState(0)
  const timeout = useRef<NodeJS.Timeout>()

  const waitMsBeforeWarning =
    (chainId ? CHAIN_INFO[chainId]?.blockWaitMsBeforeWarning : DEFAULT_MS_BEFORE_WARNING) ?? DEFAULT_MS_BEFORE_WARNING

  useEffect(() => {
    if (blockTimestamp && chainId) {
      if (Math.floor(Date.now() - blockTimestamp.mul(1000).toNumber()) > waitMsBeforeWarning) {
        if (!warning) {
          setWarning(true)
        }
      } else {
        if (warning) {
          setWarning(false)
        }
      }
    }
  }, [blockTimestamp, chainId, warning, waitMsBeforeWarning])

  useEffect(() => {
    timeout.current = setTimeout(() => {
      setMsSinceLastBlock(NETWORK_HEALTH_CHECK_MS + msSinceLastBlock)
      if (msSinceLastBlock > waitMsBeforeWarning && isWindowVisible) {
        setWarning(true)
      } else if (warning) {
        setWarning(false)
      }
    }, NETWORK_HEALTH_CHECK_MS)

    return function cleanup() {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    }
  }, [chainId, warning, isWindowVisible, msSinceLastBlock, setMsSinceLastBlock, waitMsBeforeWarning])

  useEffect(
    () => {
      if (!blockNumber) {
        return
      }

      setIsMounting(true)
      const mountingTimer = setTimeout(() => setIsMounting(false), 1000)

      // this will clear Timeout when component unmount like in willComponentUnmount
      return () => {
        clearTimeout(mountingTimer)
      }
    },
    [blockNumber] //useEffect will run only one time
    //if you pass a value to array, like this [data] than clearTimeout will run every time this value changes (useEffect re-run)
  )

  return (
    <>
      <ExternalLink
        href={chainId && blockNumber ? getExplorerLink(chainId, blockNumber.toString(), ExplorerDataType.BLOCK) : ''}
      >
        <StyledPolling onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)} warning={warning}>
          <StyledPollingNumber breathe={isMounting} hovering={isHover}>
            {blockNumber}&ensp;
          </StyledPollingNumber>
          <StyledPollingDot warning={warning}>{isMounting && <Spinner warning={warning} />}</StyledPollingDot>{' '}
        </StyledPolling>
      </ExternalLink>
      {warning && <ChainConnectivityWarning />}
    </>
  )
}
