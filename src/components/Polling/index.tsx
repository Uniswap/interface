import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { RowFixed } from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { useIsLandingPage } from 'hooks/useIsLandingPage'
import { useIsNftPage } from 'hooks/useIsNftPage'
import useMachineTimeMs from 'hooks/useMachineTime'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import ms from 'ms.macro'
import { useEffect, useMemo, useState } from 'react'
import styled, { keyframes } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { MouseoverTooltip } from '../Tooltip'
import { ChainConnectivityWarning } from './ChainConnectivityWarning'

const StyledPolling = styled.div`
  align-items: center;
  bottom: 0;
  color: ${({ theme }) => theme.textTertiary};
  display: none;
  padding: 1rem;
  position: fixed;
  right: 0;
  transition: 250ms ease color;

  a {
    color: unset;
  }
  a:hover {
    color: unset;
    text-decoration: none;
  }

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    display: flex;
  }
`
const StyledPollingBlockNumber = styled(ThemedText.DeprecatedSmall)<{
  breathe: boolean
  hovering: boolean
  warning: boolean
}>`
  color: ${({ theme, warning }) => (warning ? theme.deprecated_yellow3 : theme.accentSuccess)};
  transition: opacity 0.25s ease;
  opacity: ${({ breathe, hovering }) => (hovering ? 0.7 : breathe ? 1 : 0.5)};
  :hover {
    opacity: 1;
  }

  a {
    color: unset;
  }
  a:hover {
    text-decoration: none;
    color: unset;
  }
`
const StyledPollingDot = styled.div<{ warning: boolean }>`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  border-radius: 50%;
  position: relative;
  background-color: ${({ theme, warning }) => (warning ? theme.deprecated_yellow3 : theme.accentSuccess)};
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
  border-left: 2px solid ${({ theme, warning }) => (warning ? theme.deprecated_yellow3 : theme.accentSuccess)};
  background: transparent;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  position: relative;
  transition: 250ms ease border-color;

  left: -3px;
  top: -3px;
`

const DEFAULT_MS_BEFORE_WARNING = ms`10m`
const NETWORK_HEALTH_CHECK_MS = ms`10s`

export default function Polling() {
  const { chainId } = useWeb3React()
  const blockNumber = useBlockNumber()
  const [isMounting, setIsMounting] = useState(false)
  const [isHover, setIsHover] = useState(false)
  const machineTime = useMachineTimeMs(NETWORK_HEALTH_CHECK_MS)
  const blockTime = useCurrentBlockTimestamp()
  const isNftPage = useIsNftPage()
  const isLandingPage = useIsLandingPage()

  const waitMsBeforeWarning =
    (chainId ? getChainInfo(chainId)?.blockWaitMsBeforeWarning : DEFAULT_MS_BEFORE_WARNING) ?? DEFAULT_MS_BEFORE_WARNING

  const warning = Boolean(!!blockTime && machineTime - blockTime.mul(1000).toNumber() > waitMsBeforeWarning)

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

  //TODO - chainlink gas oracle is really slow. Can we get a better data source?

  const blockExternalLinkHref = useMemo(() => {
    if (!chainId || !blockNumber) return ''
    return getExplorerLink(chainId, blockNumber.toString(), ExplorerDataType.BLOCK)
  }, [blockNumber, chainId])

  if (isNftPage || isLandingPage) {
    return null
  }

  return (
    <RowFixed>
      <StyledPolling onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
        <StyledPollingBlockNumber breathe={isMounting} hovering={isHover} warning={warning}>
          <ExternalLink href={blockExternalLinkHref}>
            <MouseoverTooltip
              text={<Trans>The most recent block number on this network. Prices update on every block.</Trans>}
            >
              {blockNumber}&ensp;
            </MouseoverTooltip>
          </ExternalLink>
        </StyledPollingBlockNumber>
        <StyledPollingDot warning={warning}>{isMounting && <Spinner warning={warning} />}</StyledPollingDot>{' '}
      </StyledPolling>
      {warning && <ChainConnectivityWarning />}
    </RowFixed>
  )
}
