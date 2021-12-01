import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import Row, { RowFixed } from 'components/Row'
import { MouseoverTooltipContent } from 'components/Tooltip'
import { SupportedChainId } from 'constants/chains'
import { useDefaultGasCostEstimate } from 'hooks/useUSDCPrice'
import { useActiveWeb3React } from 'hooks/web3'
import { ReactNode } from 'react'
import { Info } from 'react-feather'
import ReactGA from 'react-ga'
import styled, { keyframes } from 'styled-components/macro'
import { TYPE } from 'theme'

import { AdvancedSwapDetails } from './AdvancedSwapDetails'
import GasEstimateBadge from './GasEstimateBadge'
import { ResponsiveTooltipContainer } from './styleds'
import TradePrice from './TradePrice'

const Wrapper = styled(Row)`
  height: 40px;
`

const StyledInfoIcon = styled(Info)`
  height: 16px;
  width: 16px;
  margin-right: 4px;
  color: ${({ theme }) => theme.text3};
  :hover {
    color: ${({ theme }) => theme.text1};
  }
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

interface SwapDetailsInlineProps {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
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
  // only show gas estimate if v3 trade is being used and estimate returned
  const showGasEstimate = Boolean(trade instanceof V3Trade && gasUseEstimateUSD !== null)

  // only show the loading and or default gas state if on mainnet
  // until router api supports gas estimates trades on other networks
  const { chainId } = useActiveWeb3React()
  const estimatesSupported = chainId ? SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) : false
  const { cost: defaultGasCost, syncing: defaultSyncing, loading: defaultLoading } = useDefaultGasCostEstimate()

  return (
    <Wrapper justify={'space-between'} padding="4px 0">
      <RowFixed style={{ position: 'relative' }}>
        <MouseoverTooltipContent
          wrap={false}
          content={
            trade ? (
              <ResponsiveTooltipContainer origin="top right">
                <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} syncing={syncing} />
              </ResponsiveTooltipContainer>
            ) : null
          }
          placement="bottom"
          onOpen={() =>
            ReactGA.event({
              category: 'Swap',
              action: 'Transaction Details Tooltip Open',
            })
          }
        >
          {(loading || syncing) && !(swapInputError && !trade) ? (
            <StyledPolling>
              <StyledPollingDot>
                <Spinner />
              </StyledPollingDot>
            </StyledPolling>
          ) : (
            <StyledInfoIcon />
          )}
        </MouseoverTooltipContent>
        {trade ? (
          <LoadingOpacityContainer $loading={syncing}>
            <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
          </LoadingOpacityContainer>
        ) : (loading || syncing) && !swapInputError ? (
          <TYPE.main fontSize={14}>
            <Trans>Fetching best price...</Trans>
          </TYPE.main>
        ) : swapInputError ? (
          <TYPE.main fontSize={14}>{swapInputError}</TYPE.main>
        ) : null}
      </RowFixed>
      {!estimatesSupported ? null : !trade ? (
        defaultGasCost || defaultLoading || defaultSyncing ? (
          <GasEstimateBadge gasUseEstimateUSD={defaultGasCost} loading={defaultLoading || defaultSyncing} />
        ) : null
      ) : !showGasEstimate || !gasUseEstimateUSD ? null : (
        <GasEstimateBadge gasUseEstimateUSD={gasUseEstimateUSD} loading={syncing || loading} />
      )}
    </Wrapper>
  )
}
