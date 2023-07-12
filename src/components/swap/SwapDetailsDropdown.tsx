import { Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import AnimatedDropdown from 'components/AnimatedDropdown'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import { useEffect, useState } from 'react'
import { ChevronDown, Info } from 'react-feather'
import { InterfaceTrade, LeverageTradeState, TradeState } from 'state/routing/types'
import { BorrowCreationDetails, LeverageTrade, useSwapState } from 'state/swap/hooks'
import styled, { keyframes, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { AdvancedBorrowSwapDetails,AdvancedLeverageSwapDetails, AdvancedSwapDetails } from './AdvancedSwapDetails'
import GasEstimateBadge from './GasEstimateBadge'
// import { useCurrency } from 'hooks/Tokens'
// import { Field } from 'state/swap/actions'
import GasEstimateTooltip from './GasEstimateTooltip'
import TradePrice from './TradePrice'

const Wrapper = styled(Row)`
  width: 100%;
  justify-content: center;
  border-radius: inherit;
  padding: 12px 12px;
  margin-top: 0;
  min-height: 32px;
  margin-bottom: 8px;
`

const SwapDetailsWrapper = styled.div`
  padding-top: ${({ theme }) => theme.grids.md};
`

const StyledInfoIcon = styled(Info)`
  height: 16px;
  width: 16px;
  margin-right: 4px;
  color: ${({ theme }) => theme.textTertiary};
`

const StyledCard = styled(OutlineCard)`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const StyledHeaderRow = styled(RowBetween) <{ disabled: boolean; open: boolean }>`
  padding: 0;
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'initial' : 'pointer')};
`

const RotatingArrow = styled(ChevronDown) <{ open?: boolean }>`
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
  color: ${({ theme }) => theme.textPrimary};
  transition: 250ms ease color;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
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
  background-color: ${({ theme }) => theme.backgroundInteractive};
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
  border-left: 2px solid ${({ theme }) => theme.textPrimary};
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
  allowedSlippage: Percent
  leverageTrade?: LeverageTrade
  leverageState: LeverageTradeState
  leverageInputError: boolean
}

interface BorrowDetailsDropdownProps {
  trade?: BorrowCreationDetails
  tradeState: TradeState
  syncing: boolean
  loading: boolean
  allowedSlippage: Percent
}

export default function SwapDetailsDropdown({ trade, syncing, loading, allowedSlippage, leverageTrade, leverageState,leverageInputError }: SwapDetailsInlineProps) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const [showDetails, setShowDetails] = useState(false)
  const { leverage } = useSwapState()

  // useEffect(() => {
  //   if (leverage && leverageTrade.state !== LeverageTradeState.VALID) {
  //     setShowDetails(false)
  //   }
  // }, [leverageTrade, leverage])

  const disabled = (!leverage && !trade) || (leverage && (leverageState!== LeverageTradeState.VALID || !!leverageInputError))
  // console.log('leverageTrade.state', leverageTrade.state, disabled, leverage, leverageTrade)

  useEffect(() => {
    if (leverageState !== LeverageTradeState.VALID) {
      leverage && showDetails// && setShowDetails(false) 
    }
  }, [leverageState, leverage, showDetails])

  // console.log('swapDetailsDropdown', showDetails)

  // console.log('leverageState', leverageState)

  return (
    (!leverage ? (
      <Wrapper>
        <AutoColumn gap="sm" style={{ width: '100%', marginBottom: '-8px' }}>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={SwapEventName.SWAP_DETAILS_EXPANDED}
          element={InterfaceElementName.SWAP_DETAILS_DROPDOWN}
          shouldLogImpression={!showDetails}
        >
          <StyledHeaderRow
            data-testid="swap-details-header-row"
            onClick={() => setShowDetails(!showDetails)}
            disabled={!trade}
            open={showDetails}
          >
            <RowFixed>
              {Boolean(loading || syncing) && (
                <StyledPolling>
                  <StyledPollingDot>
                    <Spinner />
                  </StyledPollingDot>
                </StyledPolling>
              )}
              {trade ? (
                <LoadingOpacityContainer $loading={syncing} data-testid="trade-price-container">
                  <TradePrice price={trade.executionPrice} />
                </LoadingOpacityContainer>
              ) : loading || syncing ? (
                <ThemedText.DeprecatedMain fontSize={14}>
                  <Trans>Fetching best price...</Trans>
                </ThemedText.DeprecatedMain>
              ) : null}
            </RowFixed>
            <RowFixed>
              {!trade?.gasUseEstimateUSD ||
                showDetails ||
                !chainId ||
                !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? null : (
                <GasEstimateTooltip trade={trade} loading={syncing || loading} disabled={showDetails} />
              )}
              <RotatingArrow
                stroke={trade ? theme.textTertiary : theme.deprecated_bg3}
                open={Boolean(trade && showDetails)}
              />
            </RowFixed>
          </StyledHeaderRow>
        </TraceEvent>
        {trade && (
          <AnimatedDropdown open={showDetails}>
            <SwapDetailsWrapper data-testid="advanced-swap-details">
              <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} syncing={syncing} />
            </SwapDetailsWrapper>
          </AnimatedDropdown>
        )}
        </AutoColumn>
      </Wrapper>
    ) : (
      <Wrapper style={{ marginTop: '0' }}>
        <AutoColumn gap="sm" style={{ width: '100%', marginBottom: '-8px' }}>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            name={SwapEventName.SWAP_DETAILS_EXPANDED}
            element={InterfaceElementName.SWAP_DETAILS_DROPDOWN}
            shouldLogImpression={!showDetails}
          >
            <StyledHeaderRow onClick={() => !disabled ? setShowDetails(!showDetails) : null} disabled={disabled} open={showDetails}>
              <RowFixed style={{ position: 'relative' }}>
                {Boolean(leverageState === LeverageTradeState.LOADING) && (
                  <StyledPolling>
                    <StyledPollingDot>
                      <Spinner />
                    </StyledPollingDot>
                  </StyledPolling>
                )}
                {
                  leverageState === LeverageTradeState.LOADING ? (
                    <ThemedText.DeprecatedMain fontSize={14}>
                      <Trans>Simulating position ...</Trans>
                    </ThemedText.DeprecatedMain>
                  ) : leverageState === LeverageTradeState.VALID ? (
                    <LoadingOpacityContainer $loading={syncing}>
                      <RowFixed>
                        <Info size={12} />
                        <ThemedText.DeprecatedMain marginLeft="5px">Trade Details</ThemedText.DeprecatedMain>
                      </RowFixed>
                    </LoadingOpacityContainer>
                  )
                    : null}
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
                <RotatingArrow
                  stroke={trade ? theme.textTertiary : theme.deprecated_bg3}
                  open={Boolean(trade && showDetails)}
                />
              </RowFixed>
            </StyledHeaderRow>
          </TraceEvent>
          <AnimatedDropdown open={showDetails}>
            <AutoColumn gap="sm" style={{ padding: '0', paddingBottom: '8px' }}>
              {leverageState === LeverageTradeState.VALID ? (
                <StyledCard>
                  <AdvancedLeverageSwapDetails leverageTrade={leverageTrade} trade={trade} allowedSlippage={allowedSlippage} syncing={syncing} />
                </StyledCard>
              )
                : null}
            </AutoColumn>
          </AnimatedDropdown>
        </AutoColumn>
      </Wrapper>
    ))

  )
}

export function BorrowDetailsDropdown({ trade, tradeState, syncing, loading, allowedSlippage }: BorrowDetailsDropdownProps) {
  const theme = useTheme()
  // const { chainId } = useWeb3React()
  const [showDetails, setShowDetails] = useState(false)
  // const { ltv } = useSwapState()

  useEffect(() => {
    if (tradeState !== TradeState.VALID) {
      showDetails ?? setShowDetails(false) 
    }
  }, [tradeState])
  const disabled = tradeState !== TradeState.VALID
  // console.log('borrow.state', tradeState, disabled, loading)
  return (
    <Wrapper style={{ marginTop: '0' }}>
      <AutoColumn gap="sm" style={{ width: '100%', marginBottom: '-8px' }}>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={SwapEventName.SWAP_DETAILS_EXPANDED}
          element={InterfaceElementName.SWAP_DETAILS_DROPDOWN}
          shouldLogImpression={!showDetails}
        >
          <StyledHeaderRow onClick={() => !disabled ? setShowDetails(!showDetails) : null} disabled={disabled} open={showDetails}>
            <RowFixed style={{ position: 'relative' }}>
              {Boolean(tradeState === TradeState.LOADING || tradeState === TradeState.SYNCING) && (
                  <StyledPolling>
                    <StyledPollingDot>
                      <Spinner />
                    </StyledPollingDot>
                  </StyledPolling>
                )}
                {
                  tradeState === TradeState.LOADING ? (
                    <ThemedText.DeprecatedMain fontSize={14}>
                      <Trans>Simulating position ...</Trans>
                    </ThemedText.DeprecatedMain>
                  ) : tradeState === TradeState.VALID ? (
                    <LoadingOpacityContainer $loading={syncing}>
                      <RowFixed>
                        <Info size={12} />
                        <ThemedText.DeprecatedMain marginLeft="5px">Trade Details</ThemedText.DeprecatedMain>
                      </RowFixed>
                    </LoadingOpacityContainer>
                  )
                    : null}
            </RowFixed>
            <RowFixed>
              <RotatingArrow
                stroke={trade ? theme.textTertiary : theme.deprecated_bg3}
                open={Boolean(trade && showDetails)}
              />

            </RowFixed>

          </StyledHeaderRow>
        </TraceEvent>
        <AnimatedDropdown open={showDetails}>
          <AutoColumn gap="sm" style={{ padding: '0', paddingBottom: '8px' }}>
            <StyledCard>
              {tradeState === TradeState.VALID ? (
                 <AdvancedBorrowSwapDetails borrowTrade={trade} syncing={syncing} />
              ) : null }
            </StyledCard>
          </AutoColumn>
        </AnimatedDropdown>
      </AutoColumn>
    </Wrapper>
  )
}

