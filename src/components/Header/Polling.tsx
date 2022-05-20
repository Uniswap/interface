import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { WETH9 } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { RowFixed } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { KROM } from 'constants/tokens'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { useAppSelector } from 'state/hooks'
import { useNetworkGasPrice } from 'state/user/hooks'
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

const StyledGasDot = styled.div`
  background-color: ${({ theme }) => theme.text3};
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

export default function Polling() {
  const { chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const theme = useTheme()

  const ethGasPrice = useNetworkGasPrice()
  const priceGwei = ethGasPrice ? ethGasPrice.multiply(JSBI.BigInt(1000000000)) : undefined
  const [isMounting, setIsMounting] = useState(false)
  const [isHover, setIsHover] = useState(false)
  const chainConnectivityWarning = useAppSelector((state) => state.application.chainConnectivityWarning)

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

  const kromToken = chainId ? KROM[chainId] : undefined
  const eth = chainId ? WETH9[chainId] : undefined
  const [, pool] = usePool(kromToken, eth, FeeAmount.MEDIUM)

  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, BigNumber.from('154097'), false)

  return (
    <>
      <StyledPolling
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        warning={chainConnectivityWarning}
      >
        {chainId === 1 ? (
          <ExternalLink href={'https://app.uniswap.org/#/pool/154097?chain=mainnet'}>
            <RowFixed style={{ marginRight: '8px' }}>
              <TYPE.main fontSize="11px" mr="8px" color={theme.text3}>
                <span>🔥</span>
                {feeValue0?.toFixed(0, { groupSeparator: ',' })} KROM
              </TYPE.main>
              <StyledGasDot />
            </RowFixed>
          </ExternalLink>
        ) : null}
        <ExternalLink href={'https://etherscan.io/gastracker'}>
          {priceGwei ? (
            <RowFixed style={{ marginRight: '8px' }}>
              <TYPE.main fontSize="11px" mr="8px" color={theme.text3}>
                <MouseoverTooltip
                  text={
                    <Trans>
                      {`The current fast gas amount for sending a transaction on the network.
                    Gas fees are paid in native currency Ether (ETH) and denominated in gwei. `}
                    </Trans>
                  }
                >
                  {priceGwei.toSignificant(2)} <Trans>gwei</Trans>
                </MouseoverTooltip>
              </TYPE.main>
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
              text={<Trans>{`The most recent block number on this network. Prices update on every block.`}</Trans>}
            >
              {blockNumber}&ensp;
            </MouseoverTooltip>
          </ExternalLink>
        </StyledPollingNumber>
        <StyledPollingDot warning={chainConnectivityWarning}>
          {isMounting && <Spinner warning={chainConnectivityWarning} />}
        </StyledPollingDot>{' '}
      </StyledPolling>
      {chainConnectivityWarning && <ChainConnectivityWarning />}
    </>
  )
}
