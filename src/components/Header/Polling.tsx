import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { RowFixed } from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import useGasPrice from 'hooks/useGasPrice'
import useMachineTimeMs from 'hooks/useMachineTime'
import JSBI from 'jsbi'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import ms from 'ms.macro'
import { useEffect, useState } from 'react'
import styled, { keyframes, useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { MouseoverTooltip } from '../Tooltip'
import { ChainConnectivityWarning } from './ChainConnectivityWarning'

const StyledPolling = styled.div<{ warning: boolean }>`
  position: fixed;
  display: flex;
  align-items: center;
  right: 0;
  bottom: 0;
  padding: 1rem;
  color: ${({ theme, warning }) => (warning ? theme.deprecated_yellow3 : theme.deprecated_green1)};
  transition: 250ms ease color;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    display: none;
  `}
`
const StyledPollingNumber = styled(ThemedText.DeprecatedSmall)<{ breathe: boolean; hovering: boolean }>`
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
  background-color: ${({ theme, warning }) => (warning ? theme.deprecated_yellow3 : theme.deprecated_green1)};
  transition: 250ms ease background-color;
`

const StyledGasDot = styled.div`
  background-color: ${({ theme }) => theme.deprecated_text3};
  border-radius: 50%;
  height: 4px;
  min-height: 4px;
  min-width: 4px;
  position: relative;
  transition: 250ms ease background-color;
  width: 4px;
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
  border-left: 2px solid ${({ theme, warning }) => (warning ? theme.deprecated_yellow3 : theme.deprecated_green1)};
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
  const theme = useTheme()

  const ethGasPrice = useGasPrice()
  const priceGwei = ethGasPrice ? JSBI.divide(ethGasPrice, JSBI.BigInt(1000000000)) : undefined

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

  return (
    <>
      <RowFixed>
        <StyledPolling onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)} warning={warning}>
          <ExternalLink href={'https://etherscan.io/gastracker'}>
            {priceGwei ? (
              <RowFixed style={{ marginRight: '8px' }}>
                <ThemedText.DeprecatedMain fontSize="11px" mr="8px" color={theme.deprecated_text3}>
                  <MouseoverTooltip
                    text={
                      <Trans>
                        The current fast gas amount for sending a transaction on L1. Gas fees are paid in
                        Ethereum&apos;s native currency Ether (ETH) and denominated in GWEI.
                      </Trans>
                    }
                  >
                    {priceGwei.toString()} <Trans>gwei</Trans>
                  </MouseoverTooltip>
                </ThemedText.DeprecatedMain>
                <StyledGasDot />
              </RowFixed>
            ) : null}
          </ExternalLink>
          <StyledPollingNumber breathe={isMounting} hovering={isHover}>
            <ExternalLink
              href={
                chainId && blockNumber ? getExplorerLink(chainId, blockNumber.toString(), ExplorerDataType.BLOCK) : ''
              }
            >
              <MouseoverTooltip
                text={<Trans>The most recent block number on this network. Prices update on every block.</Trans>}
              >
                {blockNumber}&ensp;
              </MouseoverTooltip>
            </ExternalLink>
          </StyledPollingNumber>
          <StyledPollingDot warning={warning}>{isMounting && <Spinner warning={warning} />}</StyledPollingDot>{' '}
        </StyledPolling>
        {warning && <ChainConnectivityWarning />}
      </RowFixed>
    </>
  )
}
