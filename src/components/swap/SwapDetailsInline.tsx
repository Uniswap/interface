import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { SupportedChainId } from 'constants/chains'
import { useDefaultGasCostEstimate } from 'hooks/useUSDCPrice'
import { useActiveWeb3React } from 'hooks/web3'
import { darken } from 'polished'
import { ReactNode, useState } from 'react'
import { ChevronDown, Info } from 'react-feather'
import styled, { keyframes, useTheme } from 'styled-components/macro'
import { TYPE } from 'theme'

import { AdvancedSwapDetails } from './AdvancedSwapDetails'
import GasEstimateBadge from './GasEstimateBadge'
import SwapRoute from './SwapRoute'
import TradePrice from './TradePrice'

const Wrapper = styled(Row)`
  width: 100%;
  justify-content: center;
  width: 100%;
`

const StyledInfoIcon = styled(Info)`
  height: 16px;
  width: 16px;
  margin-right: 4px;
  color: ${({ theme }) => theme.text3};
`

const StyledHeaderRow = styled(RowBetween)`
  padding: 4px 8px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.bg1};
  align-items: center;
  cursor: pointer;
  min-height: 40px;

  :hover {
    background-color: ${({ theme }) => darken(0.01, theme.bg1)};
  }
`

const RotatingArrow = styled(ChevronDown)<{ open?: boolean }>`
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'none')};
  transition: transform 0.1s linear;
`

const StyledPolling = styled.div`
  display: flex;
  margin-left: 4px;
  height: 16px;
  width: 16px;
  align-items: center;
  color: ${({ theme }) => theme.text1};
  transition: 250ms ease color;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`

const StyledPollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  border-radius: 50%;
  position: relative;
  background-color: ${({ theme }) => theme.bg2};
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

const Spinner = styled.div`
  animation: ${rotate360} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  transform: translateZ(0);
  border-top: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme }) => theme.text1};
  background: transparent;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  position: relative;
  transition: 250ms ease border-color;
  left: -3px;
  top: -3px;
`

const DropdownContent = styled.div<{ open?: boolean }>`
  max-height: ${({ open }) => (open ? '1000px' : '0px')};
  transition: max-height 0.6s ease-in-out;
  overflow: hidden;
`

interface SwapDetailsInlineProps {
  trade: Trade<Currency, Currency, TradeType> | undefined
  syncing: boolean
  loading: boolean
  showInverted: boolean
  setShowInverted: React.Dispatch<React.SetStateAction<boolean>>
  gasUseEstimateUSD: CurrencyAmount<Token> | null // dollar amount in active chain's stabelcoin
  allowedSlippage: Percent
  swapInputError: ReactNode
}

const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [SupportedChainId.MAINNET]

export default function SwapDetailsInline({
  trade,
  syncing,
  loading,
  showInverted,
  setShowInverted,
  gasUseEstimateUSD,
  allowedSlippage,
  swapInputError,
}: SwapDetailsInlineProps) {
  const theme = useTheme()

  const showGasEstimate = Boolean(gasUseEstimateUSD !== null)

  // only show the loading and or default gas state if on mainnet
  // until router api supports gas estimates trades on other networks
  const { chainId } = useActiveWeb3React()
  const estimatesSupported = chainId ? SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) : false
  const { cost: defaultGasCost, syncing: defaultSyncing, loading: defaultLoading } = useDefaultGasCostEstimate()

  const [showDetails, setShowDetails] = useState(false)

  return (
    <Wrapper>
      <AutoColumn gap="8px" style={{ width: '100%' }}>
        <StyledHeaderRow onClick={() => setShowDetails(!showDetails)}>
          <RowFixed style={{ position: 'relative' }}>
            {(loading || syncing) && !(swapInputError && !trade) ? (
              <StyledPolling>
                <StyledPollingDot>
                  <Spinner />
                </StyledPollingDot>
              </StyledPolling>
            ) : (
              <StyledInfoIcon />
            )}
            {trade ? (
              <LoadingOpacityContainer $loading={syncing}>
                <TradePrice
                  price={trade.executionPrice}
                  showInverted={showInverted}
                  setShowInverted={setShowInverted}
                />
              </LoadingOpacityContainer>
            ) : (loading || syncing) && !swapInputError ? (
              <TYPE.main fontSize={14}>
                <Trans>Fetching best price...</Trans>
              </TYPE.main>
            ) : swapInputError ? (
              <TYPE.main color="bg3" fontSize={14}>
                {swapInputError}
              </TYPE.main>
            ) : null}
          </RowFixed>
          <RowFixed>
            {showDetails ? null : !estimatesSupported ? null : !trade ? (
              defaultGasCost || defaultLoading || defaultSyncing ? (
                <GasEstimateBadge gasUseEstimateUSD={defaultGasCost} loading={defaultLoading || defaultSyncing} />
              ) : null
            ) : !showGasEstimate || !gasUseEstimateUSD ? null : (
              <GasEstimateBadge gasUseEstimateUSD={gasUseEstimateUSD} loading={syncing || loading} />
            )}
            <RotatingArrow stroke={theme.text2} open={showDetails} />
          </RowFixed>
        </StyledHeaderRow>
        <DropdownContent open={showDetails}>
          <AutoColumn gap={showDetails ? '8px' : '0'}>
            {trade ? (
              <SwapRoute
                trade={trade}
                syncing={syncing}
                gasUseEstimateUSD={showDetails ? gasUseEstimateUSD : undefined}
              />
            ) : null}
            <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} syncing={syncing} />
          </AutoColumn>
        </DropdownContent>
      </AutoColumn>
    </Wrapper>
  )
}
