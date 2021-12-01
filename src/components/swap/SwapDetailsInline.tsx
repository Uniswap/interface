import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import Row, { RowFixed } from 'components/Row'
import { MouseoverTooltipContent } from 'components/Tooltip'
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
  background-color: ${({ theme }) => theme.text1};
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

// const StyledIcon = styled(GasIcon)`
//   margin-right: 4px;
//   & > * {
//     & > * {
//       stroke: ${({ theme }) => theme.text3};
//     }
//   }
// `

interface SwapDetailsInlineProps {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
  syncing: boolean
  loading: boolean
  showInverted: boolean
  setShowInverted: React.Dispatch<React.SetStateAction<boolean>>
  gasUseEstimateUSD: CurrencyAmount<Token> | null // dollar amount in active chain's stabelcoin
  allowedSlippage: Percent
}

export default function SwapDetailsInline({
  trade,
  syncing,
  loading,
  showInverted,
  setShowInverted,
  gasUseEstimateUSD,
  allowedSlippage,
}: SwapDetailsInlineProps) {
  // only show gas estimate if v3 trade is being used and estimate returned
  const showGasEstimate = Boolean(trade instanceof V3Trade && gasUseEstimateUSD !== null)

  // only display in loading or hydrated state
  if (!trade && !syncing && !loading) {
    return null
  }

  return (
    <Wrapper justify={'space-between'} padding="4px 0">
      <RowFixed style={{ position: 'relative' }}>
        <MouseoverTooltipContent
          wrap={false}
          content={
            <ResponsiveTooltipContainer origin="top right">
              <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} syncing={syncing} />
            </ResponsiveTooltipContainer>
          }
          placement="bottom"
          onOpen={() =>
            ReactGA.event({
              category: 'Swap',
              action: 'Transaction Details Tooltip Open',
            })
          }
        >
          {loading || syncing ? (
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
        ) : loading || syncing ? (
          <TYPE.main>
            <Trans>Fetching best price...</Trans>
          </TYPE.main>
        ) : null}
      </RowFixed>
      {!showGasEstimate || !gasUseEstimateUSD ? null : (
        <GasEstimateBadge gasUseEstimateUSD={gasUseEstimateUSD} loading={syncing || loading} />
      )}
    </Wrapper>
  )
}
