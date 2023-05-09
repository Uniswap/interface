import { t, Trans } from '@lingui/macro'
import { sendAnalyticsEvent, TraceEvent } from '@uniswap/analytics'
import {
  BrowserEvent,
  InterfaceElementName,
  SwapEventName,
  SwapPriceUpdateUserResponse,
} from '@uniswap/analytics-events'
import { formatCurrencyAmount, formatPriceImpact, NumberType } from '@uniswap/conedison/format'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import {
  formatPercentInBasisPointsNumber,
  formatPercentNumber,
  formatToDecimal,
  getDurationFromDateMilliseconds,
  getDurationUntilTimestampSeconds,
  getPriceUpdateBasisPoints,
  getTokenAddress,
} from 'lib/utils/analytics'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { RouterPreference } from 'state/routing/slice'
import { InterfaceTrade } from 'state/routing/types'
import { useRouterPreference, useUserSlippageTolerance } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatTransactionAmount, priceToPreciseFloat } from 'utils/formatNumbers'
import getRoutingDiagramEntries, { RoutingDiagramEntry } from 'utils/getRoutingDiagramEntries'
import { computeRealizedPriceImpact, getPriceImpactWarning } from 'utils/prices'

import { ButtonError, SmallButtonPrimary } from '../Button'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { SwapCallbackError, SwapShowAcceptChanges } from './styleds'
import { SwapModalDetailRow } from './SwapModalDetailRow'

interface AnalyticsEventProps {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  hash: string | undefined
  allowedSlippage: Percent
  transactionDeadlineSecondsSinceEpoch: number | undefined
  isAutoSlippage: boolean
  isAutoRouterApi: boolean
  swapQuoteReceivedDate: Date | undefined
  routes: RoutingDiagramEntry[]
  fiatValueInput?: number
  fiatValueOutput?: number
}

const formatRoutesEventProperties = (routes: RoutingDiagramEntry[]) => {
  const routesEventProperties: Record<string, any[]> = {
    routes_percentages: [],
    routes_protocols: [],
  }

  routes.forEach((route, index) => {
    routesEventProperties['routes_percentages'].push(formatPercentNumber(route.percent))
    routesEventProperties['routes_protocols'].push(route.protocol)
    routesEventProperties[`route_${index}_input_currency_symbols`] = route.path.map(
      (pathStep) => pathStep[0].symbol ?? ''
    )
    routesEventProperties[`route_${index}_output_currency_symbols`] = route.path.map(
      (pathStep) => pathStep[1].symbol ?? ''
    )
    routesEventProperties[`route_${index}_input_currency_addresses`] = route.path.map((pathStep) =>
      getTokenAddress(pathStep[0])
    )
    routesEventProperties[`route_${index}_output_currency_addresses`] = route.path.map((pathStep) =>
      getTokenAddress(pathStep[1])
    )
    routesEventProperties[`route_${index}_fee_amounts_hundredths_of_bps`] = route.path.map((pathStep) => pathStep[2])
  })

  return routesEventProperties
}

const formatSwapPriceUpdatedEventProperties = (
  trade: InterfaceTrade<Currency, Currency, TradeType>,
  priceUpdate: number | undefined,
  response: SwapPriceUpdateUserResponse
) => ({
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
  response,
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  price_update_basis_points: priceUpdate,
})

const formatSwapButtonClickEventProperties = ({
  trade,
  hash,
  allowedSlippage,
  transactionDeadlineSecondsSinceEpoch,
  isAutoSlippage,
  isAutoRouterApi,
  swapQuoteReceivedDate,
  routes,
  fiatValueInput,
  fiatValueOutput,
}: AnalyticsEventProps) => ({
  estimated_network_fee_usd: trade.gasUseEstimateUSD ? formatToDecimal(trade.gasUseEstimateUSD, 2) : undefined,
  transaction_hash: hash,
  transaction_deadline_seconds: getDurationUntilTimestampSeconds(transactionDeadlineSecondsSinceEpoch),
  token_in_address: getTokenAddress(trade.inputAmount.currency),
  token_out_address: getTokenAddress(trade.outputAmount.currency),
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
  token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
  token_in_amount_usd: fiatValueInput,
  token_out_amount_usd: fiatValueOutput,
  price_impact_basis_points: formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade)),
  allowed_slippage_basis_points: formatPercentInBasisPointsNumber(allowedSlippage),
  is_auto_router_api: isAutoRouterApi,
  is_auto_slippage: isAutoSlippage,
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
  duration_from_first_quote_to_swap_submission_milliseconds: swapQuoteReceivedDate
    ? getDurationFromDateMilliseconds(swapQuoteReceivedDate)
    : undefined,
  swap_quote_block_number: trade.blockNumber,
  ...formatRoutesEventProperties(routes),
})

const DetailsContainer = styled(Column)`
  padding: 0 8px;
`

const StyledAlertTriangle = styled(AlertTriangle)`
  margin-right: 8px;
  min-width: 24px;
`

const ConfirmButton = styled(ButtonError)`
  height: 56px;
  margin-left: 10px;
`

type DetailItem = {
  label: string
  value: ReactNode
  labelTooltipText?: string
  color?: string
}

export default function SwapModalFooter({
  trade,
  allowedSlippage,
  hash,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  swapQuoteReceivedDate,
  fiatValueInput,
  fiatValueOutput,
  shouldLogModalCloseEvent,
  setShouldLogModalCloseEvent,
  showAcceptChanges,
  onAcceptChanges,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  hash: string | undefined
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  disabledConfirm: boolean
  swapQuoteReceivedDate: Date | undefined
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
  shouldLogModalCloseEvent: boolean
  setShouldLogModalCloseEvent: (shouldLog: boolean) => void
  showAcceptChanges: boolean
  onAcceptChanges: () => void
}) {
  const transactionDeadlineSecondsSinceEpoch = useTransactionDeadline()?.toNumber() // in seconds since epoch
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const [routerPreference] = useRouterPreference()
  const routes = getRoutingDiagramEntries(trade)
  const [lastExecutionPrice, setLastExecutionPrice] = useState(trade.executionPrice)
  const [priceUpdate, setPriceUpdate] = useState<number>()
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency(chainId)

  useEffect(() => {
    if (!trade.executionPrice.equalTo(lastExecutionPrice)) {
      setPriceUpdate(getPriceUpdateBasisPoints(lastExecutionPrice, trade.executionPrice))
      setLastExecutionPrice(trade.executionPrice)
    }
  }, [lastExecutionPrice, setLastExecutionPrice, trade.executionPrice])

  useEffect(() => {
    if (shouldLogModalCloseEvent && showAcceptChanges) {
      sendAnalyticsEvent(
        SwapEventName.SWAP_PRICE_UPDATE_ACKNOWLEDGED,
        formatSwapPriceUpdatedEventProperties(trade, priceUpdate, SwapPriceUpdateUserResponse.REJECTED)
      )
    }
    setShouldLogModalCloseEvent(false)
  }, [shouldLogModalCloseEvent, showAcceptChanges, setShouldLogModalCloseEvent, trade, priceUpdate])

  const details = useMemo(() => {
    const label = `${trade.executionPrice.baseCurrency?.symbol} `
    const labelInverted = `${trade.executionPrice.quoteCurrency?.symbol}`
    const formattedPrice = formatTransactionAmount(priceToPreciseFloat(trade.executionPrice))
    const details: Array<DetailItem> = [
      { label: t`Exchange rate`, value: `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}` },
      {
        label: t`Network fee`,
        value: `~${formatCurrencyAmount(trade.gasUseEstimateUSD, NumberType.FiatGasPrice)}`,
        labelTooltipText: t`The fee paid to miners who process your transaction. This must be paid in ${nativeCurrency.symbol}.`,
      },
      {
        label: t`Price impact`,
        value: trade.priceImpact ? formatPriceImpact(trade.priceImpact) : '-',
        color: getPriceImpactWarning(trade.priceImpact),
        labelTooltipText: t`The impact your trade has on the market price of this pool.`,
      },
    ]
    if (trade.tradeType === TradeType.EXACT_INPUT) {
      details.push({
        label: t`Minimum received`,
        value: `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`,
        labelTooltipText: t`The minimum amount you are guaranteed to receive. If the price slips any further, your transaction will revert.`,
      })
    } else {
      details.push({
        label: t`Maximum sent`,
        value: `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`,
        labelTooltipText: t`The maximum amount you are guaranteed to spend. If the price slips any further, your transaction will revert.`,
      })
    }

    return details
  }, [allowedSlippage, nativeCurrency.symbol, trade])

  return (
    <>
      <DetailsContainer gap="md">
        {details.map(({ label, value, color, labelTooltipText }) => (
          <SwapModalDetailRow
            key={label}
            label={label}
            value={value}
            color={color}
            labelTooltipText={labelTooltipText}
          />
        ))}
      </DetailsContainer>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges justify="flex-start" data-testid="show-accept-changes">
          <RowBetween>
            <RowFixed>
              <StyledAlertTriangle size={20} />
              <ThemedText.DeprecatedMain color={theme.accentAction}>
                <Trans>Price updated</Trans>
              </ThemedText.DeprecatedMain>
            </RowFixed>
            <SmallButtonPrimary onClick={onAcceptChanges}>
              <Trans>Accept</Trans>
            </SmallButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : (
        <AutoRow>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            element={InterfaceElementName.CONFIRM_SWAP_BUTTON}
            name={SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED}
            properties={formatSwapButtonClickEventProperties({
              trade,
              hash,
              allowedSlippage,
              transactionDeadlineSecondsSinceEpoch,
              isAutoSlippage,
              isAutoRouterApi: routerPreference === RouterPreference.AUTO || routerPreference === RouterPreference.API,
              swapQuoteReceivedDate,
              routes,
              fiatValueInput: fiatValueInput.data,
              fiatValueOutput: fiatValueOutput.data,
            })}
          >
            <ConfirmButton
              data-testid="confirm-swap-button"
              onClick={onConfirm}
              disabled={disabledConfirm}
              $borderRadius="12px"
              id={InterfaceElementName.CONFIRM_SWAP_BUTTON}
            >
              <ThemedText.HeadlineSmall>
                <Trans>Swap</Trans>
              </ThemedText.HeadlineSmall>
            </ConfirmButton>
          </TraceEvent>

          {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
        </AutoRow>
      )}
    </>
  )
}
