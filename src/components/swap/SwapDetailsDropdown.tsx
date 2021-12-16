import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import AnimatedDropdown from 'components/AnimatedDropdown'
import Card, { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { MouseoverTooltipContent } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks/web3'
import { darken } from 'polished'
import { useState } from 'react'
import { ChevronDown, Info } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import styled, { keyframes, useTheme } from 'styled-components/macro'
import { HideSmall, ThemedText } from 'theme'

import { AdvancedSwapDetails } from './AdvancedSwapDetails'
import GasEstimateBadge, { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from './GasEstimateBadge'
import { ResponsiveTooltipContainer } from './styleds'
import SwapRoute from './SwapRoute'
import TradePrice from './TradePrice'

const Wrapper = styled(Row)`
  width: 100%;
  justify-content: center;
`

const StyledInfoIcon = styled(Info)`
  height: 16px;
  width: 16px;
  margin-right: 4px;
  color: ${({ theme }) => theme.text3};
`

const StyledCard = styled(OutlineCard)`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.bg2};
`

const StyledHeaderRow = styled(RowBetween)<{ disabled: boolean; open: boolean }>`
  padding: 4px 8px;
  border-radius: 12px;
  background-color: ${({ open, theme }) => (open ? theme.bg1 : 'transparent')};
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'initial' : 'pointer')};
  min-height: 40px;

  :hover {
    background-color: ${({ theme, disabled }) => (disabled ? theme.bg1 : darken(0.015, theme.bg1))};
  }
`

const RotatingArrow = styled(ChevronDown)<{ open?: boolean }>`
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'none')};
  transition: transform 0.1s linear;
`

const StyledPolling = styled.div`
  display: flex;
  height: 16px;
  width: 16px;
  margin-right: 2px;
  margin-left: 10px;
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
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  syncing: boolean
  loading: boolean
  showInverted: boolean
  setShowInverted: React.Dispatch<React.SetStateAction<boolean>>
  allowedSlippage: Percent
}

export default function SwapDetailsDropdown({
  trade,
  syncing,
  loading,
  showInverted,
  setShowInverted,
  allowedSlippage,
}: SwapDetailsInlineProps) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Wrapper>
      <AutoColumn gap={'8px'} style={{ width: '100%', marginBottom: '-8px' }}>
        <StyledHeaderRow onClick={() => setShowDetails(!showDetails)} disabled={!trade} open={showDetails}>
          <RowFixed style={{ position: 'relative' }}>
            {loading || syncing ? (
              <StyledPolling>
                <StyledPollingDot>
                  <Spinner />
                </StyledPollingDot>
              </StyledPolling>
            ) : (
              <HideSmall>
                <MouseoverTooltipContent
                  wrap={false}
                  content={
                    <ResponsiveTooltipContainer origin="top right" style={{ padding: '0' }}>
                      <Card padding="12px">
                        <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} syncing={syncing} />
                      </Card>
                    </ResponsiveTooltipContainer>
                  }
                  placement="bottom"
                  disableHover={showDetails}
                >
                  <StyledInfoIcon color={trade ? theme.text3 : theme.bg3} />
                </MouseoverTooltipContent>
              </HideSmall>
            )}
            {trade ? (
              <LoadingOpacityContainer $loading={syncing}>
                <TradePrice
                  price={trade.executionPrice}
                  showInverted={showInverted}
                  setShowInverted={setShowInverted}
                />
              </LoadingOpacityContainer>
            ) : loading || syncing ? (
              <ThemedText.Main fontSize={14}>
                <Trans>Fetching best price...</Trans>
              </ThemedText.Main>
            ) : null}
          </RowFixed>
          <RowFixed>
            {!trade?.gasUseEstimateUSD ||
            showDetails ||
            !chainId ||
            !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? null : (
              <GasEstimateBadge
                trade={trade}
                loading={syncing || loading}
                showRoute={!showDetails}
                disableHover={showDetails}
              />
            )}
            <RotatingArrow stroke={trade ? theme.text3 : theme.bg3} open={Boolean(trade && showDetails)} />
          </RowFixed>
        </StyledHeaderRow>
        <AnimatedDropdown open={showDetails}>
          <AutoColumn gap={'8px'} style={{ padding: '0', paddingBottom: '8px' }}>
            {trade ? (
              <StyledCard>
                <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} syncing={syncing} />
              </StyledCard>
            ) : null}
            {trade ? <SwapRoute trade={trade} syncing={syncing} /> : null}
          </AutoColumn>
        </AnimatedDropdown>
      </AutoColumn>
    </Wrapper>
  )
}
