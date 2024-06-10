import { InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Percent } from '@uniswap/sdk-core'
import AnimatedDropdown from 'components/AnimatedDropdown'
import Column from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { RowBetween, RowFixed } from 'components/Row'
import { Trans } from 'i18n'
import { formatCommonPropertiesForTrade } from 'lib/utils/analytics'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import { isSubmittableTrade } from 'state/routing/utils'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useFormatter } from 'utils/formatNumbers'
import GasEstimateTooltip from './GasEstimateTooltip'
import SwapLineItem, { SwapLineItemType } from './SwapLineItem'
import TradePrice from './TradePrice'

const StyledHeaderRow = styled(RowBetween)<{ disabled: boolean; open: boolean }>`
  padding: 0;
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'initial' : 'pointer')};
`

const RotatingArrow = styled(ChevronDown)<{ open?: boolean }>`
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'none')};
  transition: transform 0.1s linear;
`

const SwapDetailsWrapper = styled(Column)`
  padding-top: ${({ theme }) => theme.grids.md};
`

const Wrapper = styled(Column)`
  border-radius: 16px;
  padding: 12px 16px;
`

interface SwapDetailsProps {
  trade?: InterfaceTrade
  syncing: boolean
  loading: boolean
  allowedSlippage: Percent
  priceImpact?: Percent
  volatility?: number
}

export default function SwapDetailsDropdown(props: SwapDetailsProps) {
  const { trade, syncing, loading, allowedSlippage } = props
  const theme = useTheme()
  const [showDetails, setShowDetails] = useState(false)
  const trace = useTrace()

  return (
    <Wrapper>
      <Trace
        logPress
        logImpression={!showDetails}
        eventOnTrigger={SwapEventName.SWAP_DETAILS_EXPANDED}
        element={InterfaceElementName.SWAP_DETAILS_DROPDOWN}
        properties={{
          ...(trade ? formatCommonPropertiesForTrade(trade, allowedSlippage) : {}),
          ...trace,
        }}
      >
        <StyledHeaderRow
          data-testid="swap-details-header-row"
          onClick={() => setShowDetails(!showDetails)}
          disabled={!trade}
          open={showDetails}
        >
          <RowFixed>
            {trade ? (
              <LoadingOpacityContainer $loading={syncing} data-testid="trade-price-container">
                <TradePrice price={trade.executionPrice} />
              </LoadingOpacityContainer>
            ) : loading || syncing ? (
              <ThemedText.DeprecatedMain fontSize={14}>
                <Trans i18nKey="swap.fetchingBestPrice" />
              </ThemedText.DeprecatedMain>
            ) : null}
          </RowFixed>
          <RowFixed gap="xs">
            {!showDetails && isSubmittableTrade(trade) && (
              <GasEstimateTooltip trade={trade} loading={syncing || loading} />
            )}
            <RotatingArrow stroke={trade ? theme.neutral3 : theme.surface2} open={Boolean(trade && showDetails)} />
          </RowFixed>
        </StyledHeaderRow>
      </Trace>
      <AdvancedSwapDetails {...props} open={showDetails} />
    </Wrapper>
  )
}

function AdvancedSwapDetails(props: SwapDetailsProps & { open: boolean }) {
  const { open, trade, allowedSlippage, syncing = false, priceImpact, volatility} = props
  const format = useFormatter()

  if (!trade) {
    return null
  }
  const lineItemProps = { trade, allowedSlippage, format, syncing, priceImpact, volatility}

  return (
    <AnimatedDropdown open={open}>
      <SwapDetailsWrapper gap="sm" data-testid="advanced-swap-details">
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.PRICE_IMPACT} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.MAX_SLIPPAGE} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.INPUT_TOKEN_FEE_ON_TRANSFER} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.OUTPUT_TOKEN_FEE_ON_TRANSFER} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.SWAP_FEE} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.NETWORK_COST} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.ROUTING_INFO} />
      </SwapDetailsWrapper>
    </AnimatedDropdown>
  )
}
